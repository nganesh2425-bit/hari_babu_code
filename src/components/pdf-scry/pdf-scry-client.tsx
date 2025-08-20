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
import * as pdfjs from 'pdfjs-dist';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { summarizePdf } from '@/ai/flows/summarize-pdf';
import { cn } from '@/lib/utils';

// pdf.js worker configuration
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type ExtractedContent = {
  text: string;
  paragraphs: string[];
  tables: string[][][];
  images: string[];
};

export function PdfScryClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();
  
  const parsePdf = async (file: File): Promise<ExtractedContent> => {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
        const pdf = await pdfjs.getDocument(typedArray).promise;
        let fullText = '';
        const paragraphs: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          let pageText = '';
          let lastY: number | null = null;
          let paragraphBuffer = '';

          textContent.items.forEach((item: any) => {
            pageText += item.str + ' ';
            if (lastY !== null && item.transform[5] < lastY) {
               if(paragraphBuffer.trim()) paragraphs.push(paragraphBuffer.trim());
               paragraphBuffer = '';
            }
            paragraphBuffer += item.str + ' ';
            lastY = item.transform[5];
          });
          if(paragraphBuffer.trim()) paragraphs.push(paragraphBuffer.trim());

          fullText += pageText + '\n\n';
        }
        
        resolve({
          text: fullText.trim(),
          paragraphs: paragraphs.filter(p => p.length > 20),
          tables: [], // Table extraction is complex and would need a more advanced solution
          images: [], // Image extraction is also complex
        });
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

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

      try {
        const content = await parsePdf(selectedFile);
        setExtractedContent(content);

        if (content.text) {
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
        } else {
          setSummary('No text found in PDF to summarize.');
        }

      } catch(e) {
         toast({
          variant: 'destructive',
          title: 'PDF Parsing Error',
          description: 'Could not extract content from the PDF.',
        });
      } finally {
        setIsLoading(false);
      }
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
            <TabsTrigger value="tables" disabled><Table className="mr-2" />Tables</TabsTrigger>
            <TabsTrigger value="images" disabled><ImageIcon className="mr-2" />Images</TabsTrigger>
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
