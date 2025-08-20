"use client";

import { useState, useCallback, type DragEvent, useMemo } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  FileText,
  Loader2,
  Table,
  Image as ImageIcon,
  Pilcrow,
  Download,
  X,
  File as FileIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { summarizePdf } from '@/ai/flows/summarize-pdf';
import { cn } from '@/lib/utils';

type ExtractedContent = {
  text: string;
  paragraphs: string[];
  tables: string[][][];
  images: string[];
};

const DUMMY_CONTENT: ExtractedContent = {
  text: `PDF Scry: An Overview. This document outlines the core functionalities of the PDF Scry application. It is designed to extract text, tables, and images from PDF documents efficiently. Key features include AI-powered summarization, which provides users with a concise overview of the document's content.

Section 1: Text Extraction. The application parses through the PDF to identify and extract all textual content. This includes paragraphs, headings, and lists. The extracted text is then made available for download as a plain text file.

Section 2: Table Recognition. PDF Scry can detect and extract tabular data. The tables are presented in a structured format, preserving rows and columns. This feature is particularly useful for data analysis and reporting.

Section 3: Image Parsing. All images embedded within the PDF are extracted and displayed. Users have the option to download individual images or all images at once. This is ideal for presentations and reports where visual content is important.`,
  paragraphs: [
    "PDF Scry: An Overview. This document outlines the core functionalities of the PDF Scry application. It is designed to extract text, tables, and images from PDF documents efficiently. Key features include AI-powered summarization, which provides users with a concise overview of the document's content.",
    "Section 1: Text Extraction. The application parses through the PDF to identify and extract all textual content. This includes paragraphs, headings, and lists. The extracted text is then made available for download as a plain text file.",
    "Section 2: Table Recognition. PDF Scry can detect and extract tabular data. The tables are presented in a structured format, preserving rows and columns. This feature is particularly useful for data analysis and reporting.",
    "Section 3: Image Parsing. All images embedded within the PDF are extracted and displayed. Users have the option to download individual images or all images at once. This is ideal for presentations and reports where visual content is important.",
  ],
  tables: [
    [
      ["Feature", "Description", "Status"],
      ["Text Extraction", "Extracts all text content", "Implemented"],
      ["Table Recognition", "Extracts tables", "Implemented"],
      ["Image Parsing", "Extracts images", "Implemented"],
      ["AI Summarization", "Generates content summary", "Implemented"],
    ],
  ],
  images: ["https://placehold.co/600x400.png", "https://placehold.co/400x300.png"],
};

export function PdfScryClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    async (selectedFile: File | null) => {
      if (!selectedFile) return;
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
        });
        return;
      }
      
      setFile(selectedFile);
      setIsLoading(true);
      setExtractedContent(null);
      setSummary(null);

      // Simulate PDF parsing
      setTimeout(async () => {
        const content = DUMMY_CONTENT;
        setExtractedContent(content);
        setIsLoading(false);
        
        try {
          const result = await summarizePdf({ text: content.text });
          setSummary(result.summary);
        } catch (error) {
          console.error('Summarization failed:', error);
          toast({
            variant: 'destructive',
            title: 'AI Summarization Failed',
            description: 'Could not generate a summary for the document.',
          });
          setSummary('Could not generate summary.');
        }

      }, 1500);
    },
    [toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] || null);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDownloadText = () => {
    if (!extractedContent) return;
    const blob = new Blob([extractedContent.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace('.pdf', '')}_text.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Error',
        description: 'Could not download the image.',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedContent(null);
    setIsLoading(false);
    setSummary(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (extractedContent) {
      return (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="summary"><FileText className="mr-2" />Summary</TabsTrigger>
            <TabsTrigger value="text"><FileText className="mr-2" />Full Text</TabsTrigger>
            <TabsTrigger value="paragraphs"><Pilcrow className="mr-2" />Paragraphs</TabsTrigger>
            <TabsTrigger value="tables"><Table className="mr-2" />Tables</TabsTrigger>
            <TabsTrigger value="images"><ImageIcon className="mr-2" />Images</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <p className="text-muted-foreground leading-relaxed">{summary}</p>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="text">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Extracted Text</CardTitle>
                <Button onClick={handleDownloadText}><Download className="mr-2 h-4 w-4" />Download Text</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap">{extractedContent.text}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paragraphs">
            <Card>
              <CardHeader><CardTitle>Extracted Paragraphs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {extractedContent.paragraphs.map((p, i) => (
                  <div key={i} className="border-l-4 border-primary pl-4 py-2 bg-secondary/50 rounded-r-md">
                    <p className="text-sm text-secondary-foreground">{p}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <Card>
              <CardHeader><CardTitle>Extracted Tables</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {extractedContent.tables.map((table, i) => (
                  <div key={i} className="rounded-md border">
                  <UiTable>
                    <TableHeader>
                      <TableRow>
                        {table[0].map((header, j) => <TableHead key={j}>{header}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.slice(1).map((row, k) => (
                        <TableRow key={k}>
                          {row.map((cell, l) => <TableCell key={l}>{cell}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </UiTable>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader><CardTitle>Extracted Images</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {extractedContent.images.map((img, i) => (
                    <Card key={i} className="overflow-hidden group">
                      <CardContent className="p-0 relative">
                        <Image src={img} alt={`Extracted image ${i+1}`} width={600} height={400} className="w-full h-auto object-cover" data-ai-hint="document diagram" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => handleDownloadImage(img, i)}><Download className="mr-2 h-4 w-4" />Download</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        {!file ? (
          <label 
            htmlFor="pdf-upload" 
            className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors", isDragging && "bg-muted border-primary")}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF (MAX. 800x400px)</p>
            </div>
            <input id="pdf-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <X className="h-5 w-5" />
                <span className="sr-only">Upload another file</span>
              </Button>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center flex-col gap-4 text-muted-foreground py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="font-medium">Analyzing your document...</p>
                <p className="text-sm">Extracting text, tables, and images.</p>
              </div>
            )}
            {renderContent()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
