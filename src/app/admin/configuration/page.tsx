
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode } from "lucide-react";

export default function ConfigurationPage() {

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Configuration</CardTitle>
                    <CardDescription>System configuration and settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                        <FileCode className="h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-2xl font-semibold font-headline">Configuration Page</h2>
                        <p className="mt-2 text-muted-foreground">This page is under construction.</p>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}
