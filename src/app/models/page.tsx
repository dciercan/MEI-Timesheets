
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAvailableModels } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
    const models = await getAvailableModels();

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Available AI Models</CardTitle>
                    <CardDescription>This is a list of models available through your current Genkit configuration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Supports Multimodality</TableHead>
                                <TableHead>Supports JSON Output</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map((model: any) => (
                                <TableRow key={model.name}>
                                    <TableCell className="font-medium">{model.name}</TableCell>
                                    <TableCell>{model.label}</TableCell>
                                    <TableCell>
                                        <Badge variant={model.supports.multimodality ? "default" : "secondary"}>
                                            {model.supports.multimodality ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={model.supports.json ? "default" : "secondary"}>
                                            {model.supports.json ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    )
}
