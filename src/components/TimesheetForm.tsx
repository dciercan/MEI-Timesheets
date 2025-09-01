
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { addCrewDocket, getActivities, getUsers, getUnproductiveReasons, getLocations } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, set, isEqual } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, Loader2, Send } from "lucide-react";
import type { Activity, User, UnproductiveReason, Location } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "next/navigation";


const formSchema = z.object({
  shiftStart: z.coerce.date({ required_error: "A start date is required." }),
  shiftEnd: z.coerce.date({ required_error: "An end date is required." }),
  crewMemberIds: z.array(z.string()),
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  asset: z.string().min(1, "Please select an asset."),
  subAsset: z.string().min(1, "Please select a sub-asset."),
  activityId: z.string().min(1, "Please select an activity."),
  productiveHours: z.coerce.number().min(0, "Productive hours must be a positive number."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      minutes: z.coerce.number().min(1, "Minutes must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
  submittedById: z.string().min(1, "Supervisor is required."),
}).refine((data) => data.shiftEnd > data.shiftStart, {
    message: "End date/time must be after start date/time.",
    path: ["shiftEnd"],
});

type FormValues = z.infer<typeof formSchema>;

const DateTimePicker = ({ field }: { field: any }) => {
    const [date, setDate] = useState<Date | undefined>(field.value ? new Date(field.value) : new Date());
    const [time, setTime] = useState(field.value ? format(new Date(field.value), 'HH:mm') : '00:00');
    const { onChange, value } = field;

    useEffect(() => {
        if (value) {
            const newDate = new Date(value);
            if (!isEqual(date || 0, newDate)) {
              setDate(newDate);
              setTime(format(newDate, 'HH:mm'));
            }
        }
    }, [value, date]);

    useEffect(() => {
        if (date) {
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = set(date, { hours, minutes });
             if (!value || !isEqual(value, newDate)) {
                onChange(newDate);
            }
        }
    }, [date, time, onChange, value]);
    
    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(date) => date > new Date() || date < new Date("2000-01-01")} initialFocus />
                </PopoverContent>
            </Popover>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
    );
};


function TimesheetFormContent() {
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();
  const searchParams = useSearchParams();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unproductiveReasons, setUnproductiveReasons] = useState<UnproductiveReason[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");

   useEffect(() => {
    async function fetchData() {
      if(loggedInUser) {
        const [fetchedUsers, fetchedActivities, fetchedUnproductive, fetchedLocations] = await Promise.all([
          getUsers(loggedInUser),
          getActivities(),
          getUnproductiveReasons(),
          getLocations(),
        ]);
        setAllUsers(fetchedUsers);
        setActivities(fetchedActivities);
        setUnproductiveReasons(fetchedUnproductive);
        setLocations(fetchedLocations);
      }
    }
    fetchData();
  }, [loggedInUser]);

  const canSelectCompany = loggedInUser?.appRole === 'Admin' || loggedInUser?.appRole === 'MEI Supervisor';
  const isSubbieAdmin = loggedInUser?.appRole === 'Subcontractor Admin';
  const isSupervisor = loggedInUser?.appRole === 'Crew Supervisor' || loggedInUser?.appRole === 'MEI Supervisor';

  const companies = useMemo(() => {
    return [...new Set(allUsers.filter(u => u.appRole === 'Crew Supervisor' || u.appRole === 'MEI Supervisor').map(u => u.company))].sort();
  }, [allUsers]);

  const supervisors = useMemo(() => {
    if (!loggedInUser) return [];
    let companyToFilter = "";
    if (canSelectCompany) {
      companyToFilter = selectedCompany;
    } else if (isSubbieAdmin) {
      companyToFilter = loggedInUser.company;
    }
    
    if (!companyToFilter) return [];

    return allUsers.filter(u => u.company === companyToFilter && (u.appRole === 'Crew Supervisor' || u.appRole === 'MEI Supervisor'));
  }, [allUsers, loggedInUser, canSelectCompany, isSubbieAdmin, selectedCompany]);

  useEffect(() => {
    if (loggedInUser && (loggedInUser.appRole === 'Crew Supervisor' || loggedInUser.appRole === 'MEI Supervisor')) {
      setSelectedSupervisorId(loggedInUser.id);
    }
    if (isSubbieAdmin) {
      setSelectedCompany(loggedInUser.company);
    }
  }, [loggedInUser, isSubbieAdmin]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crewMemberIds: [],
      zone: "",
      section: "",
      asset: "",
      subAsset: "",
      activityId: "",
      productiveHours: 0,
      quantity: 0,
      unproductiveEntries: [],
      notes: "",
      submittedById: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unproductiveEntries",
  });

  const selectedAsset = form.watch("asset");
  const selectedSubAsset = form.watch("subAsset");
  const selectedZone = form.watch("zone");

  const assets = useMemo(() => [...new Set(activities.map(a => a.asset))], [activities]);

  const subAssets = useMemo(() => {
    if (!selectedAsset) return [];
    return [...new Set(activities.filter(a => a.asset === selectedAsset).map(a => a.subAsset))];
  }, [selectedAsset, activities]);

  useEffect(() => {
    if (subAssets.length === 1 && form.getValues('subAsset') === '') {
      form.setValue("subAsset", subAssets[0]);
    }
  }, [subAssets, form]);

  const filteredActivities = useMemo(() => {
    if (!selectedAsset || !selectedSubAsset) return [];
    return activities.filter(a => a.asset === selectedAsset && a.subAsset === selectedSubAsset);
  }, [selectedAsset, selectedSubAsset, activities]);

  const sectionsForSelectedZone = useMemo(() => {
    if (!selectedZone) return [];
    return locations.find(l => l.zone === selectedZone)?.sections || [];
  }, [selectedZone, locations]);

  useEffect(() => {
    if (searchParams.has('asset') && activities.length > 0) {
      const initialData: { [key: string]: any } = {
          productiveHours: 0,
          quantity: 0,
      };
      searchParams.forEach((value, key) => {
        if (key === 'crewMemberIds' || key === 'unproductiveEntries') {
            try { initialData[key] = JSON.parse(value); } catch { /* ignore parse error */ }
        } else if (key === 'productiveHours' || key === 'quantity') {
            initialData[key] = parseFloat(value) || 0;
        } else if (key === 'shiftStart' || key === 'shiftEnd') {
            initialData[key] = new Date(value);
        } else {
          initialData[key] = value;
        }
      });
      form.reset(initialData);

      if (initialData.activityId) {
        const activity = activities.find(a => a.id === initialData.activityId);
        if (activity) setSelectedActivity(activity);
      }
    }
  }, [searchParams, activities, form]);

   useEffect(() => {
    if (selectedSupervisorId) {
      form.setValue("submittedById", selectedSupervisorId);
    }
   }, [selectedSupervisorId, form]);


  const onSubmit = async (values: FormValues) => {
    if (!loggedInUser) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    }
    
    try {
        const result = await addCrewDocket(values);

        if (result.success && result.docketId) {
            toast({
                title: "Crew Docket Submitted!",
                description: `Created docket ${result.docketId}.`,
            });
            form.reset({
                shiftStart: undefined,
                shiftEnd: undefined,
                crewMemberIds: [],
                zone: "",
                section: "",
                asset: "",
                subAsset: "",
                activityId: "",
                productiveHours: 0,
                quantity: 0,
                unproductiveEntries: [],
                notes: "",
                submittedById: (isSubbieAdmin || canSelectCompany) ? "" : selectedSupervisorId,
            });
            if (isSubbieAdmin || canSelectCompany) setSelectedSupervisorId("");
            if (canSelectCompany) setSelectedCompany("");
            setSelectedActivity(null);
        } else {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: result.error || "An unknown error occurred.",
            });
        }
    } catch (error) {
        console.error("Submission failed:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: "An unknown error occurred." });
    }
  };

  const selectedSupervisor = useMemo(() => {
    return allUsers.find(u => u.id === selectedSupervisorId) || loggedInUser;
  }, [allUsers, selectedSupervisorId, loggedInUser]);

 const crewMembers = useMemo(() => {
    if (!selectedSupervisor) return [];
    return allUsers
      .filter(u => 
        u.company === selectedSupervisor.company && 
        (u.appRole === 'Crew Member' || u.appRole === 'Crew Supervisor') &&
        u.id !== selectedSupervisor.id
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [allUsers, selectedSupervisor]);


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">New Crew Docket</CardTitle>
              <CardDescription>
                Timesheet for: <span className="font-semibold">{selectedSupervisor?.fullName} ({selectedSupervisor?.company})</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {canSelectCompany && (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        setSelectedCompany(value);
                        setSelectedSupervisorId("");
                        form.setValue("submittedById", "");
                        form.setValue("crewMemberIds", []);
                      }}
                      value={selectedCompany}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company} value={company}>{company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
                {(canSelectCompany || isSubbieAdmin) && (
                  <FormField
                    control={form.control}
                    name="submittedById"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crew Supervisor</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedSupervisorId(value);
                              form.setValue("crewMemberIds", []);
                          }} 
                          value={field.value}
                          disabled={!selectedCompany}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a supervisor" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {supervisors.map(sup => (
                              <SelectItem key={sup.id} value={sup.id}>{sup.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Timesheet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="shiftStart"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Start Date/Time</FormLabel>
                          <DateTimePicker field={field} />
                          <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shiftEnd"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>End Date/Time</FormLabel>
                          <DateTimePicker field={field} />
                          <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

               <FormField
                  control={form.control}
                  name="crewMemberIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Crew Members (Supervisor is automatically included)</FormLabel>
                        <ScrollArea className="h-40 w-full rounded-md border p-4">
                            <div className="space-y-2">
                            {crewMembers.map((user) => (
                                <FormField
                                key={user.id}
                                control={form.control}
                                name="crewMemberIds"
                                render={({ field }) => (
                                    <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(user.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), user.id])
                                                : field.onChange(field.value?.filter((value) => value !== user.id))
                                            }}
                                            disabled={!selectedSupervisorId}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">{user.fullName} ({user.company})</FormLabel>
                                    </FormItem>
                                )}
                                />
                            ))}
                            </div>
                        </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium font-headline">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone</FormLabel>
                          <Select onValueChange={(value) => { field.onChange(value); form.setValue("section", ""); }} value={field.value} disabled={!selectedSupervisorId}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a zone" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {locations.map(loc => <SelectItem key={loc.zone} value={loc.zone}>{loc.zone}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedZone}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a section" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  {sectionsForSelectedZone.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-medium font-headline">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                    <FormField
                        control={form.control}
                        name="asset"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Asset</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); form.setValue("subAsset", ""); form.setValue("activityId", ""); setSelectedActivity(null); }} value={field.value} disabled={!selectedSupervisorId}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an asset" /></SelectTrigger></FormControl>
                            <SelectContent>{assets.map(asset => <SelectItem key={asset} value={asset}>{asset}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subAsset"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sub Asset</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); form.setValue("activityId", ""); setSelectedActivity(null); }} value={field.value} disabled={!selectedAsset || !selectedSupervisorId}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a sub-asset" /></SelectTrigger></FormControl>
                            <SelectContent>{subAssets.map(subAsset => <SelectItem key={subAsset} value={subAsset}>{subAsset}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="activityId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Activity</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); setSelectedActivity(activities.find(a => a.id === value) || null); }} value={field.value} disabled={!selectedSubAsset || !selectedSupervisorId}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an activity" /></SelectTrigger></FormControl>
                            <SelectContent>{filteredActivities.map(act => (<SelectItem key={act.id} value={act.id}>{act.activity}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-4">
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantity {selectedActivity ? `(${selectedActivity.activityUom})` : ''}</FormLabel>
                            <FormControl><Input type="number" step="0.1" placeholder="e.g., 25" {...field} disabled={!selectedSupervisorId}/></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="productiveHours"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Productive Hours (per person)</FormLabel>
                            <FormControl><Input type="number" step="0.1" placeholder="e.g., 8" {...field} disabled={!selectedSupervisorId}/></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
              </div>


              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Unproductive Time (per person)</h3>
                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4 flex-grow">
                             <FormField
                                control={form.control}
                                name={`unproductiveEntries.${index}.reasonId`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger></FormControl>
                                        <SelectContent>{unproductiveReasons.map(reason => (<SelectItem key={reason.id} value={reason.id}>{reason.reason}</SelectItem>))}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`unproductiveEntries.${index}.minutes`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Time (minutes)</FormLabel>
                                    <FormControl><Input type="number" step="1" placeholder="e.g., 30" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove</span></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ reasonId: "", minutes: 30 })} disabled={!selectedSupervisorId}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Unproductive Time
                  </Button>
                </div>
              </div>

               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea placeholder="Add any relevant notes..." {...field} disabled={!selectedSupervisorId}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
               <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting || !selectedSupervisorId}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                    Submit Crew Docket
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default function TimesheetForm() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <TimesheetFormContent />
    </React.Suspense>
  )
}
