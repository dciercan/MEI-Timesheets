

"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { addTimesheet, getUsers } from "@/lib/actions";
import { activities, unproductiveReasons } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, Loader2, Send } from "lucide-react";
import type { Activity, User } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  timesheetDate: z.date({
    required_error: "A timesheet date is required.",
  }),
  crewMemberIds: z.array(z.string()).min(1, "Please select at least one crew member."),
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  asset: z.string().min(1, "Please select an asset."),
  subAsset: z.string().min(1, "Please select a sub-asset."),
  activityId: z.string().min(1, "Please select an activity."),
  productiveHours: z.coerce.number().min(0.1, "Productive hours must be greater than 0."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      hours: z.coerce.number().min(1, "Minutes must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
  submittedById: z.string().min(1, "Supervisor is required."),
});

const zoneOptions = ['S1', 'S2', 'S3', 'S4', 'S5', 'MAN RAMPS', 'LPR RAMPS'];
const sectionOptions = ['M011', 'M01J', 'M020 S1', 'M020 S2', 'Central Corridor', 'XP1', 'XP2', 'XP3', 'XP4', 'XP5'];

export default function TimesheetForm() {
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");

   useEffect(() => {
    async function fetchUsers() {
      const users = await getUsers();
      setAllUsers(users);
    }
    fetchUsers();
  }, []);

  const isAdmin = loggedInUser?.appRole === 'Admin' || loggedInUser?.appRole === 'Subcontractor Admin';
  const supervisors = useMemo(() => {
    if (!loggedInUser) return [];
    return allUsers.filter(u => u.company === loggedInUser.company && (u.appRole === 'Crew Supervisor' || u.appRole === 'MEI Supervisor'));
  }, [allUsers, loggedInUser]);

  useEffect(() => {
    if (loggedInUser && !isAdmin) {
      setSelectedSupervisorId(loggedInUser.id);
    }
  }, [loggedInUser, isAdmin]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timesheetDate: new Date(),
      crewMemberIds: [],
      zone: "",
      section: "",
      asset: "",
      subAsset: "",
      activityId: "",
      productiveHours: 8,
      quantity: 0,
      unproductiveEntries: [],
      notes: "",
      submittedById: "",
    },
  });

   useEffect(() => {
    if (selectedSupervisorId) {
      form.setValue("submittedById", selectedSupervisorId);
    }
   }, [selectedSupervisorId, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unproductiveEntries",
  });

  const selectedAsset = form.watch("asset");
  const selectedSubAsset = form.watch("subAsset");

  const assets = useMemo(() => [...new Set(activities.map(a => a.asset))], []);
  const subAssets = useMemo(() => {
    if (!selectedAsset) return [];
    return [...new Set(activities.filter(a => a.asset === selectedAsset).map(a => a.subAsset))];
  }, [selectedAsset]);
  const filteredActivities = useMemo(() => {
    if (!selectedAsset || !selectedSubAsset) return [];
    return activities.filter(a => a.asset === selectedAsset && a.subAsset === selectedSubAsset);
  }, [selectedAsset, selectedSubAsset]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!loggedInUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to submit a timesheet.",
        });
        return;
    }
    try {
        // Automatically include the supervisor in the list of crew members for submission
        const finalValues = {
            ...values,
            crewMemberIds: [...new Set([...values.crewMemberIds, values.submittedById])]
        };

        const result = await addTimesheet(finalValues);

        if (result.success && result.submissionIds) {
             toast({
                title: "Timesheet Submitted!",
                description: `Created submissions for crew members.`,
            });
            form.reset({
                timesheetDate: new Date(),
                crewMemberIds: [],
                zone: "",
                section: "",
                asset: "",
                subAsset: "",
                activityId: "",
                productiveHours: 8,
                quantity: 0,
                unproductiveEntries: [],
                notes: "",
                submittedById: isAdmin ? "" : selectedSupervisorId,
            });
            if (isAdmin) {
              setSelectedSupervisorId("");
            }
            setSelectedActivity(null);
        } else {
             toast({
                variant: "destructive",
                title: "Submission Failed",
                description: result.error || "There was an error submitting the timesheet.",
             });
        }
    } catch (error) {
      console.error("Submission failed:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting the timesheet.",
      });
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
        u.id !== selectedSupervisor.id // Exclude the selected supervisor
      )
      .sort((a, b) => {
        if (a.appRole === 'Crew Supervisor' && b.appRole !== 'Crew Supervisor') return -1;
        if (a.appRole !== 'Crew Supervisor' && b.appRole === 'Crew Supervisor') return 1;
        return a.fullName.localeCompare(b.fullName);
      });
 }, [allUsers, selectedSupervisor]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">New Timesheet</CardTitle>
              <CardDescription>
                Timesheet for: <span className="font-semibold">{selectedSupervisor?.fullName} ({selectedSupervisor?.company})</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               {isAdmin && (
                <FormField
                  control={form.control}
                  name="submittedById"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crew Supervisor</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedSupervisorId(value);
                            form.setValue("crewMemberIds", []);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supervisor" />
                          </SelectTrigger>
                        </FormControl>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="timesheetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Timesheet Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!selectedSupervisorId}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={user.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(user.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), user.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== user.id
                                                    )
                                                )
                                            }}
                                            disabled={!selectedSupervisorId}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        {user.fullName} ({user.company})
                                        </FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                            </div>
                        </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSupervisorId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zoneOptions.map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSupervisorId}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sectionOptions.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                  <FormField
                    control={form.control}
                    name="asset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("subAsset", "");
                          form.setValue("activityId", "");
                          setSelectedActivity(null);
                        }} value={field.value} disabled={!selectedSupervisorId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assets.map(asset => <SelectItem key={asset} value={asset}>{asset}</SelectItem>)}
                          </SelectContent>
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
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("activityId", "");
                          setSelectedActivity(null);
                        }} value={field.value} disabled={!selectedAsset || !selectedSupervisorId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sub-asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subAssets.map(subAsset => <SelectItem key={subAsset} value={subAsset}>{subAsset}</SelectItem>)}
                          </SelectContent>
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
                        <FormLabel>Activity Selection</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedActivity(activities.find(a => a.id === value) || null);
                          }}
                          value={field.value}
                          disabled={!selectedSubAsset || !selectedSupervisorId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an activity" />
                            </Trigger>
                          </FormControl>
                          <SelectContent>
                            {filteredActivities.map(act => (
                              <SelectItem key={act.id} value={act.id}>{act.activity}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-4">
                  <FormField
                    control={form.control}
                    name="productiveHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Productive Hours</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 8" {...field} disabled={!selectedSupervisorId}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity {selectedActivity ? `(${selectedActivity.activityUom})` : ''}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 25" {...field} disabled={!selectedSupervisorId}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Unproductive Time (Optional)</h3>
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
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a reason" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {unproductiveReasons.map(reason => (
                                            <SelectItem key={reason.id} value={reason.id}>{reason.reason}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`unproductiveEntries.${index}.hours`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Time (minutes)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="1" placeholder="e.g., 30" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ reasonId: "", hours: 30 })}
                    disabled={!selectedSupervisorId}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Unproductive Time
                  </Button>
                </div>
              </div>

               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any relevant notes..." {...field} disabled={!selectedSupervisorId}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !selectedSupervisorId}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                Submit Timesheet
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
