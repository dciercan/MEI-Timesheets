
'use client';

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateTimesheet, getUsers } from "@/lib/actions";
import type { TimesheetSubmission, Activity, User } from "@/lib/types";
import { activities, unproductiveReasons } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const formSchema = z.object({
  id: z.string(),
  timesheetDate: z.date(),
  crewMemberId: z.string().min(1, "Crew member is required."),
  asset: z.string().min(1, "Asset is required."),
  subAsset: z.string().min(1, "Sub-asset is required."),
  activityId: z.string().min(1, "Activity is required."),
  productiveHours: z.coerce.number().min(0.1, "Productive hours must be greater than 0."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      hours: z.coerce.number().min(1, "Minutes must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface EditTimesheetDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    submission: TimesheetSubmission;
    onSubmissionUpdated: () => void;
}

export default function EditTimesheetDialog({ isOpen, onOpenChange, submission, onSubmissionUpdated }: EditTimesheetDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    }
    loadUsers();
  }, []);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        ...submission,
        timesheetDate: new Date(submission.timesheetDate),
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unproductiveEntries",
  });
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

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


  useEffect(() => {
    if (submission) {
        const initialActivity = activities.find(a => a.id === submission.activityId) || null;
        setSelectedActivity(initialActivity);
        form.reset({
            ...submission,
            timesheetDate: new Date(submission.timesheetDate),
        });
    }
  }, [submission, form]);


  const onSubmit = async (values: FormSchemaType) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (key === 'timesheetDate' && value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (key === 'unproductiveEntries' && Array.isArray(value)) {
                value.forEach((entry, index) => {
                    formData.append(`unproductiveEntries[${index}][reasonId]`, entry.reasonId);
                    formData.append(`unproductiveEntries[${index}][hours]`, entry.hours.toString());
                });
            }
            else {
                formData.append(key, String(value));
            }
        }
    });
    
    const result = await updateTimesheet(formData);

    if (result.success) {
        onSubmissionUpdated();
    } else {
        console.error("Update failed:", result.error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "There was an error updating the submission.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Timesheet Submission</DialogTitle>
          <DialogDescription>Update the details for the selected timesheet entry.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="crewMemberId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Crew Member</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a crew member" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    }} value={field.value}>
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
                    }} value={field.value} disabled={!selectedAsset}>
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
                    <FormLabel>Activity</FormLabel>
                    <Select
                        onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedActivity(activities.find(a => a.id === value) || null);
                        }}
                        value={field.value}
                        disabled={!selectedSubAsset}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an activity" />
                        </SelectTrigger>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="productiveHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Productive Hours</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.1" {...field} />
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
                        <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-2">
                <h3 className="text-base font-medium">Unproductive Time (Optional)</h3>
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
                    size="sm"
                    onClick={() => append({ reasonId: "", hours: 30 })}
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
                      <Textarea placeholder="Add any relevant notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
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
