
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LocationConfig from "@/components/LocationConfig";
import ActivityConfig from "@/components/ActivityConfig";
import UnproductiveTimeConfig from "@/components/UnproductiveTimeConfig";
import { getActivities, getUnproductiveReasons, getLocations } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, ListChecks, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ConfigurationPage() {
    const [activities, unproductiveReasons, locations] = await Promise.all([
        getActivities(),
        getUnproductiveReasons(),
        getLocations(),
    ]);

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
            <header className="mb-6">
                <h1 className="text-3xl font-bold font-headline">System Configuration</h1>
                <p className="text-muted-foreground">Manage core application data and settings.</p>
            </header>
            <Tabs defaultValue="locations">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="locations">
                        <Map className="mr-2" />
                        Locations
                    </TabsTrigger>
                    <TabsTrigger value="activities">
                        <ListChecks className="mr-2" />
                        Activities
                    </TabsTrigger>
                    <TabsTrigger value="unproductive">
                        <Clock className="mr-2" />
                        Unproductive Time
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="locations">
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Manage Locations</CardTitle>
                            <CardDescription>Add, edit, or remove zones and sections available for timesheet entries.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <LocationConfig locations={locations} />
                        </CardContent>
                     </Card>
                </TabsContent>
                <TabsContent value="activities">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Manage Activities</CardTitle>
                            <CardDescription>Configure assets, sub-assets, and the activities associated with them.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityConfig activities={activities} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="unproductive">
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Manage Unproductive Time</CardTitle>
                            <CardDescription>Define the reasons and codes for non-productive work hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UnproductiveTimeConfig reasons={unproductiveReasons} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
