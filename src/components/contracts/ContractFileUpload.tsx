import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, ExternalLink, X } from 'lucide-react';

/**
 * Upload de arquivos (DOCX / PDF) para o bucket `contracts`.
 * O componente devolve a URL pública do arquivo
 * que pode ser armazenada no contrato.
 */
export function ContractFileUpload({
  onUpload: setUrl,
}: {
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const storageFileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(storageFileName, file, { upsert: false });
    if (error) {
      toast.error('Falha ao enviar arquivo');
      console.error(error);
    } else {
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(data.path);
      setUrl(urlData.publicUrl);
      setFileUrl(urlData.publicUrl);
      setFileName(file.name);
      toast.success('Arquivo enviado');
    }
    setUploading(false);
  };

  const handleRemove = () => {
    setFileName(null);
    setFileUrl(null);
    setUrl('');
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="application/pdf,.doc,.docx"
        disabled={uploading}
        onChange={handleFileChange}
        className="hidden"
        id="contract-file-upload"
      />
      {fileUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{fileName}</span>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-80">
            <ExternalLink className="h-4 w-4" />
          </a>
          <button onClick={handleRemove} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label htmlFor="contract-file-upload" className="inline-block">
          <Button disabled={uploading} variant="outline" asChild>
            <span>{uploading ? 'Enviando...' : 'Selecionar arquivo (PDF/DOCX)'}</span>
          </Button>
        </label>
      )}
    </div>
  );
}
