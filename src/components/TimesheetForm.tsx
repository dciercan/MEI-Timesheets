"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { suggestActivity } from "@/ai/flows/activity-suggestion";
import { addTimesheet } from "@/lib/actions";
import { users, activities, unproductiveReasons } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, Wand2, Loader2, Send } from "lucide-react";
import type { Activity } from "@/lib/types";

const formSchema = z.object({
  timesheetDate: z.date({
    required_error: "A timesheet date is required.",
  }),
  crewMemberId: z.string().min(1, "Please select a crew member."),
  zone: z.string().min(1, "Zone is required."),
  section: z.string().min(1, "Section is required."),
  workDescription: z.string().min(10, "Please provide a brief description of the work (min 10 characters)."),
  activityId: z.string().min(1, "Please select an activity."),
  productiveHours: z.coerce.number().min(0.1, "Productive hours must be greater than 0."),
  quantity: z.coerce.number().min(0, "Quantity is required."),
  unproductiveEntries: z.array(
    z.object({
      reasonId: z.string().min(1, "Please select a reason."),
      hours: z.coerce.number().min(0.1, "Hours must be greater than 0."),
    })
  ).optional(),
  notes: z.string().optional(),
});

export default function TimesheetForm() {
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestedActivities, setSuggestedActivities] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timesheetDate: new Date(),
      crewMemberId: "",
      zone: "",
      section: "",
      workDescription: "",
      activityId: "",
      productiveHours: 8,
      quantity: 0,
      unproductiveEntries: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unproductiveEntries",
  });

  const handleSuggestActivity = async () => {
    const { zone, section, workDescription } = form.getValues();
    if (!zone || !section || !workDescription) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in Zone, Section, and Work Description to get suggestions.",
      });
      return;
    }

    setIsAiLoading(true);
    setSuggestedActivities([]);
    form.setValue("activityId", "");
    setSelectedActivity(null);
    try {
      const result = await suggestActivity({ zone, section, description: workDescription || '' });
      const suggestions = result.suggestedActivities;
      setSuggestedActivities(suggestions);
      if (suggestions.length === 0) {
        toast({ title: "No suggestions found", description: "Try refining your work description." });
      }
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get activity suggestions. Please select one manually.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addTimesheet(values);
      toast({
        title: "Timesheet Submitted!",
        description: `Timesheet for ${users.find(u => u.id === values.crewMemberId)?.fullName} has been saved.`,
      });
      form.reset();
      setSuggestedActivities([]);
      setSelectedActivity(null);
    } catch (error) {
      console.error("Submission failed:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting the timesheet.",
      });
    }
  };

  const filteredActivities = activities.filter(act => {
      if (suggestedActivities.length > 0) {
          return suggestedActivities.includes(act.activity);
      }
      return true;
  });

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">New Timesheet</CardTitle>
              <CardDescription>Enter details for a crew member's work day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  name="crewMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crew Member</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a crew member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.filter(u => u.appRole === 'Crew Member').map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <FormControl>
                          <Input placeholder="e.g., North" {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input placeholder="e.g., A1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium font-headline">Activity</h3>
                 <FormField
                  control={form.control}
                  name="workDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the work performed to get AI-powered activity suggestions, e.g., 'fixed potholes on the main road'" {...field} />
                      </FormControl>
                      <FormDescription>This helps in suggesting the right activity.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" onClick={handleSuggestActivity} disabled={isAiLoading}>
                  {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Suggest Activity
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                  <div className="md:col-span-1">
                      <FormField
                          control={form.control}
                          name="activityId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Activity Selection</FormLabel>
                              <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedActivity(activities.find(a => a.id === value) || null);
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={suggestedActivities.length > 0 ? "Select a suggested activity" : "Select an activity"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredActivities.map(act => (
                                        <SelectItem key={act.id} value={act.id}>{act.activity}</SelectItem>
                                    ))}
                                    {filteredActivities.length === 0 && suggestedActivities.length > 0 && <div className="p-4 text-sm text-muted-foreground">No matching activities found for suggestions.</div>}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                  </div>
                  <FormField
                      control={form.control}
                      name="productiveHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Productive Hours</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="e.g., 8" {...field} />
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
                            <Input type="number" step="0.1" placeholder="e.g., 25" {...field} />
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
                                    <FormLabel>Hours</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="e.g., 1" {...field} />
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
                    onClick={() => append({ reasonId: "", hours: 1 })}
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

            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
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
