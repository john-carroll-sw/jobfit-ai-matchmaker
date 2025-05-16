import { useState, useEffect } from 'react';

interface FileTypeMapping {
  [key: string]: string;  // Maps file extensions to MIME types
}

interface FileWithExtension {
  name: string;
  type?:string;
}

const useFileType = (file: FileWithExtension | null) => {
  const [fileType, setFileType] = useState<string>('');

  // MIME type mapping for common file extensions
  const mimeTypes: FileTypeMapping = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'html': 'text/html',
    'csv': 'text/csv',
    'zip': 'application/zip',
    'mp3': 'audio/mp3',
    'mp4': 'video/mp4',
    'json': 'application/json',
    'xml': 'application/xml',
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';  // Extract file extension and make it lowercase
  };

  const getMimeType = (file: FileWithExtension): string => {
    const extension = getFileExtension(file.name);

    // If the file has a recognized extension, return the associated MIME type
    if (mimeTypes[extension]) {
      return mimeTypes[extension];
    }

    // Otherwise, use file.type (this is the MIME type provided by the browser)
    return file.type || 'application/octet-stream';
  };

  // When the file is provided, determine the file type
  useEffect(() => {
    if (file) {
      setFileType(getMimeType(file));  // Update file type when the file changes
    }
  }, [file]);

  return {
    fileType,
    getMimeType,
  };
};

export default useFileType;
