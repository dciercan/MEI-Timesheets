

'use client';

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateCrewDocket, getUsers, getLocations, getActivities, getUnproductiveReasons } from "@/lib/actions";
import type { CrewDocketWithDetails, Activity, User, Location, UnproductiveReason } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  crewDocketId: z.string(),
  shiftStart: z.coerce.date(),
  shiftEnd: z.coerce.date(),
  crewMemberIds: z.array(z.string()),
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  asset: z.string().min(1, "Asset is required."),
  subAsset: z.string().min(1, "Sub-asset is required."),
  activityId: z.string().min(1, "Activity is required."),
  productiveHours: z.coerce.number().min(0, "Productive hours must be a positive number."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      hours: z.coerce.number().min(0.1, "Hours must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
}).refine((data) => data.shiftEnd > data.shiftStart, {
    message: "End date/time must be after start date/time.",
    path: ["shiftEnd"],
});;

type FormSchemaType = z.infer<typeof formSchema>;

interface EditSubmissionCrewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    docket: CrewDocketWithDetails;
    onSubmissionUpdated: () => void;
}

const DateTimePicker = ({ field, disabled }: { field: any, disabled?: boolean }) => {
    const [date, setDate] = useState<Date | undefined>(field.value ? new Date(field.value) : undefined);
    const [time, setTime] = useState(field.value ? format(new Date(field.value), 'HH:mm') : '00:00');

    useEffect(() => {
        if (field.value) {
            setDate(new Date(field.value));
            setTime(format(new Date(field.value), 'HH:mm'));
        }
    }, [field.value]);

    useEffect(() => {
        if (date) {
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = set(date, { hours, minutes });
            if (field.value?.getTime() !== newDate.getTime()) {
              field.onChange(newDate);
            }
        }
    }, [date, time, field]);

    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={disabled}>
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(date) => date > new Date() || date < new Date("2000-01-01")} initialFocus />
                </PopoverContent>
            </Popover>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={disabled} />
        </div>
    );
};

export default function EditSubmissionCrewDialog({ isOpen, onOpenChange, docket, onSubmissionUpdated }: EditSubmissionCrewDialogProps) {
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [unproductiveReasons, setUnproductiveReasons] = useState<UnproductiveReason[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const representativeTimesheet = docket.timesheets[0] || {};

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        crewDocketId: docket.id,
        shiftStart: representativeTimesheet.shiftStart ? new Date(representativeTimesheet.shiftStart) : new Date(),
        shiftEnd: representativeTimesheet.shiftEnd ? new Date(representativeTimesheet.shiftEnd) : new Date(),
        crewMemberIds: docket.crewMemberIds.filter(id => id !== docket.submittedById),
        zone: docket.zone,
        section: docket.section,
        asset: docket.asset,
        subAsset: docket.subAsset,
        activityId: docket.activityId,
        quantity: docket.quantity || 0,
        notes: docket.notes || '',
        productiveHours: representativeTimesheet.productiveHours || 0,
        unproductiveEntries: representativeTimesheet.unproductiveEntries || [],
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unproductiveEntries",
  });
  
  const selectedAsset = form.watch("asset");
  const selectedSubAsset = form.watch("subAsset");
  const selectedZone = form.watch("zone");
  
  const uniqueZones = useMemo(() => [...new Set(locations.map(l => l.zone))], [locations]);

  const assets = useMemo(() => [...new Set(activities.map(a => a.asset))], [activities]);
  
  const subAssets = useMemo(() => {
    if (!selectedAsset) return [];
    return [...new Set(activities.filter(a => a.asset === selectedAsset).map(a => a.subAsset))];
  }, [selectedAsset, activities]);

  useEffect(() => {
    if (subAssets.length === 1 && !form.getValues('subAsset')) {
      form.setValue("subAsset", subAssets[0]);
    }
  }, [subAssets, form]);

  const filteredActivities = useMemo(() => {
    if (!selectedAsset || !selectedSubAsset) return [];
    return activities.filter(a => a.asset === selectedAsset && a.subAsset === selectedSubAsset && a.isActive);
  }, [selectedAsset, selectedSubAsset, activities]);

  const sectionsForSelectedZone = useMemo(() => {
    if (!selectedZone) return [];
    return locations.filter(l => l.zone === selectedZone && l.isActive).map(l => l.section);
  }, [selectedZone, locations]);

  useEffect(() => {
    async function loadData() {
      if(loggedInUser) {
        const [fetchedUsers, fetchedLocations, fetchedActivities, fetchedReasons] = await Promise.all([
          getUsers(loggedInUser),
          getLocations(),
          getActivities(),
          getUnproductiveReasons()
        ]);
        setAllUsers(fetchedUsers);
        setLocations(fetchedLocations);
        setActivities(fetchedActivities);
        setUnproductiveReasons(fetchedReasons);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loggedInUser]);

  useEffect(() => {
    if (isOpen && activities.length > 0) {
        const initialActivity = activities.find(a => a.id === docket.activityId) || null;
        setSelectedActivity(initialActivity);
    }
  }, [docket, isOpen, activities]);


  const onSubmit = async (values: FormSchemaType) => {
    const result = await updateCrewDocket(values);

    if (result.success) {
        onSubmissionUpdated();
    } else {
        console.error("Update failed:", result.error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "There was an error updating the crew docket.",
        });
    }
  };

  const crewMembers = useMemo(() => {
    if (!loggedInUser) return [];
    // The company context is the company of the docket being edited.
    const companyToShow = docket.company;
    return allUsers
      .filter(u => 
        u.company === companyToShow && 
        (u.appRole === 'Crew Member' || u.appRole === 'Crew Supervisor') &&
        u.id !== docket.submittedById // Exclude the supervisor who submitted it.
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [allUsers, loggedInUser, docket]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Crew Docket</DialogTitle>
          <DialogDescription>Update the details for the entire crew docket. This will affect all crew members in this entry.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                        return checked ? field.onChange([...(field.value || []), user.id]) : field.onChange(field.value?.filter((value) => value !== user.id))
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">{user.fullName} ({user.company})</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); form.setValue("section", ""); }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a zone" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {uniqueZones.map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); form.setValue("subAsset", ""); form.setValue("activityId", ""); setSelectedActivity(null); }} value={field.value}>
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
                    <Select onValueChange={(value) => { field.onChange(value); form.setValue("activityId", ""); setSelectedActivity(null); }} value={field.value} disabled={!selectedAsset}>
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
                    <Select onValueChange={(value) => { field.onChange(value); setSelectedActivity(activities.find(a => a.id === value) || null); }} value={field.value} disabled={!selectedSubAsset}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select an activity" /></SelectTrigger></FormControl>
                        <SelectContent>{filteredActivities.map(act => (<SelectItem key={act.id} value={act.id}>{act.activity}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity {selectedActivity ? `(${selectedActivity.activityUom})` : ''}</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
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
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>

            <div className="space-y-2">
                <h3 className="text-base font-medium">Unproductive Time (per person, optional)</h3>
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
                                name={`unproductiveEntries.${index}.hours`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Time (hours)</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder="e.g., 0.5" {...field} /></FormControl>
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
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ reasonId: "", hours: 0.5 })}>
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
                    <FormControl><Textarea placeholder="Add any relevant notes..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
