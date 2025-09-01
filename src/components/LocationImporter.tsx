
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowRight, Loader2, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { importLocations } from '@/lib/actions';
import { Progress } from './ui/progress';

interface LocationImporterProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportFinished: () => void;
}

type ImportStep = 'upload' | 'mapColumns' | 'preview' | 'importing' | 'report';
type LocationData = { zone: string; section: string };

export default function LocationImporter({ isOpen, onOpenChange, onImportFinished }: LocationImporterProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [zoneColumn, setZoneColumn] = useState('');
  const [sectionColumn, setSectionColumn] = useState('');
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importReport, setImportReport] = useState<{ created: number; updated: number; deleted: number; total: number} | null>(null);

  const { toast } = useToast();

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setFileName('');
    setHeaders([]);
    setData([]);
    setZoneColumn('');
    setSectionColumn('');
    setDeleteMissing(false);
    setIsProcessing(false);
    setImportReport(null);
  };
  
  const handleClose = (open: boolean) => {
    if (!open) {
        resetState();
    }
    onOpenChange(open);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid CSV file.',
        });
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      parseCsv(selectedFile);
    }
  };

  const parseCsv = (csvFile: File) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
            setHeaders(results.meta.fields);
            guessColumns(results.meta.fields);
            setData(results.data);
            setStep('mapColumns');
        } else {
            toast({ variant: 'destructive', title: 'CSV Error', description: 'Could not read headers from CSV file.' });
        }
      },
      error: (error: any) => {
        toast({ variant: 'destructive', title: 'CSV Parsing Error', description: error.message });
      },
    });
  };

  const guessColumns = (fields: string[]) => {
    const lowercasedFields = fields.map(f => f.toLowerCase());
    const zoneGuess = fields[lowercasedFields.findIndex(f => f.includes('zone'))] || '';
    const sectionGuess = fields[lowercasedFields.findIndex(f => f.includes('section'))] || '';
    setZoneColumn(zoneGuess);
    setSectionColumn(sectionGuess);
  };

  const mappedData = useMemo(() => {
    if (!zoneColumn || !sectionColumn) return [];
    return data.map(row => ({
      zone: row[zoneColumn],
      section: row[sectionColumn],
    })).filter(item => item.zone && item.section);
  }, [data, zoneColumn, sectionColumn]);


  const handleStartImport = async () => {
    setIsProcessing(true);
    setStep('importing');

    const result = await importLocations({ locations: mappedData, deleteMissing });
    
    if (result.success && result.report) {
        setImportReport(result.report);
    } else {
        toast({ variant: 'destructive', title: 'Import Failed', description: result.error });
    }

    setIsProcessing(false);
    setStep('report');
  };
  
  const finishAndClose = () => {
    onImportFinished();
    handleClose(false);
  }

  const progress = useMemo(() => {
    switch (step) {
      case 'upload': return 0;
      case 'mapColumns': return 25;
      case 'preview': return 50;
      case 'importing': return 75;
      case 'report': return 100;
      default: return 0;
    }
  }, [step]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Locations from CSV</DialogTitle>
           <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-8 text-center">
             <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV file (up to 5MB)</p>
                </div>
                <input id="csv-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv" />
            </label>
          </div>
        )}

        {step === 'mapColumns' && (
          <div className="space-y-4 py-4">
             <p>Map the columns from your CSV file to the required location fields.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                 <div className="space-y-2">
                    <label className="font-medium">Zone</label>
                    <Select value={zoneColumn} onValueChange={setZoneColumn}>
                        <SelectTrigger><SelectValue placeholder="Select CSV column for Zone" /></SelectTrigger>
                        <SelectContent>
                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <label className="font-medium">Section</label>
                     <Select value={sectionColumn} onValueChange={setSectionColumn}>
                        <SelectTrigger><SelectValue placeholder="Select CSV column for Section" /></SelectTrigger>
                        <SelectContent>
                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
             </div>
             <DialogFooter>
                <Button variant="outline" onClick={resetState}>Back to Upload</Button>
                <Button onClick={() => setStep('preview')} disabled={!zoneColumn || !sectionColumn}>
                    Next: Preview Data <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
             </DialogFooter>
          </div>
        )}

        {step === 'preview' && (
            <div className="space-y-4 py-4">
                <p>Review the data to be imported. The import will create new locations and update existing ones.</p>
                <div className="border rounded-md">
                    <ScrollArea className="h-64">
                         <Table>
                            <TableHeader className="sticky top-0 bg-muted">
                                <TableRow>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Section</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappedData.slice(0, 100).map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{row.zone}</TableCell>
                                        <TableCell>{row.section}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </ScrollArea>
                </div>
                <p className="text-sm text-muted-foreground">
                    Showing first 100 of {mappedData.length} total rows.
                </p>
                <div className="flex items-center space-x-2 pt-4">
                    <Checkbox id="delete-missing" checked={deleteMissing} onCheckedChange={(checked) => setDeleteMissing(Boolean(checked))} />
                    <label htmlFor="delete-missing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Delete existing locations that are not in this import file.
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setStep('mapColumns')}>Back to Mapping</Button>
                    <Button onClick={handleStartImport} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Importing...' : `Import ${mappedData.length} Locations`}
                    </Button>
                </DialogFooter>
            </div>
        )}
        
        {step === 'importing' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <h3 className="text-xl font-semibold">Importing Locations...</h3>
                <p className="text-muted-foreground">Please wait while we process your file.</p>
            </div>
        )}

        {step === 'report' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                {importReport ? (
                    <>
                        <CheckCircle className="h-16 w-16 text-green-500" />
                        <h3 className="text-2xl font-bold">Import Complete</h3>
                        <div className="text-center text-muted-foreground">
                            <p>Created: <span className="font-bold text-foreground">{importReport.created}</span></p>
                            <p>Updated: <span className="font-bold text-foreground">{importReport.updated}</span></p>
                            <p>Deleted: <span className="font-bold text-foreground">{importReport.deleted}</span></p>
                            <p className="mt-2">Total locations now: <span className="font-bold text-foreground">{importReport.total}</span></p>
                        </div>
                    </>
                ) : (
                     <>
                        <AlertCircle className="h-16 w-16 text-destructive" />
                        <h3 className="text-2xl font-bold">Import Failed</h3>
                        <p className="text-center text-muted-foreground">Something went wrong during the import process. Please try again.</p>
                     </>
                )}
                 <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={resetState}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Start New Import
                    </Button>
                    <Button onClick={finishAndClose}>
                        Done
                    </Button>
                </DialogFooter>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

