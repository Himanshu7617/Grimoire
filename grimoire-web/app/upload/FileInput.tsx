"use client";
import { useEffect, useRef, useState } from "react";
import type { FileItem } from "./types";
import axios, { AxiosProgressEvent } from "axios";

const FileInput = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [url, setUrl] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = files.length > 0 && url.length > 0;
  const [upload, SetUpload] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return;
    }

    const selectedFiles: FileItem[] = Array.from(event.target.files).map(
      (file, idx) => ({
        file,
        id: `${file.name}-${Date.now()}-${idx}`,
        progress: 0,
        uploaded: false,
      })
    );

    setFiles((prev) => [...prev, ...selectedFiles]);
  }
  function handleFileRemove(id: string) {
    if (!files) return;
    setFiles((prev) => prev?.filter((file) => file.id !== id));
  }
  function handleAddUrl() {
    const nextUrl = currentUrl.trim();
    if (!nextUrl) {
      return;
    }
    setUrl((prev) => [...prev, nextUrl]);
    setCurrentUrl("");
  }
  function handleRemoveUrl(urlToRemove: string) {
    setUrl((prev) => prev.filter((urlItem) => urlItem !== urlToRemove));
  }
  async function handleUploadResouces() {
    if (files.length === 0 && url.length === 0) return;

    setIsUploading(true);

    // Simulate upload progress
    const uploadedFiles = files.map(async (file) => {
      const formData = new FormData();
      formData.append("files", file.file);

      try {
        await axios.post("/api/ingest/", formData, {
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setFiles((prevFiles) =>
              prevFiles.map((f) => (f.id === file.id ? { ...f, progress } : f))
            );
          },
        });

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id ? { ...f, uploaded: true } : f
          )
        );
      } catch (error) {
        console.error("Upload failed for file:", file.file.name, error);
      }
    });

    //now upload the urls
    url.forEach(async (urlItem) => {
      try {
        await axios.post("/api/ingest/", { url: urlItem });
      } catch (error) {
        console.error("Upload failed for URL:", urlItem, error);
      }
    });
    await Promise.all(uploadedFiles);
    setIsUploading(false);
    setFiles([]);
    setUrl([]);
  }
  useEffect(() => {
    function checkCanUpload() {
      if ((url.length === 0 && files.length === 0) || isUploading) {
        SetUpload(false);
      } else {
        SetUpload(true);
      }
    }
    checkCanUpload();
  }, [url, files, isUploading]);
  return (
    <div className="w-fit h-fit flex flex-col justify-center items-center">
      <ul className="w-fit h-fit flex flex-col justify-center items-center gap-2 ">
        {files &&
          Array.from(files).map((file, index) => (
            <li
              key={index}
              className="p-2 border w-full flex flex-col justify-between items-center m-1 border-gray-600 rounded"
            >
              <div className="p-2 w-full flex justify-between items-center m-1 rounded">
                <p>{file.file.name}</p>
                <span
                  onClick={() => {
                    handleFileRemove(file.id);
                  }}
                  className="bold ml-1 cursor-pointer hover:text-red-500 border-[0.5px] border-gray-300 rounded p-2"
                >
                  x
                </span>
              </div>
              <div className="w-full h-4 rounded-2xl border border-gray-600 overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-2xl transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </li>
          ))}
      </ul>
      <div className="mb-4">
        <label
          htmlFor="file-input"
          className="w-full h-300px bg-green-50 border-2 flex justify-center items-center border-dashed rounded-2xl border-gray-600 p-20 cursor-pointer"
        >
          choose files
        </label>
        <input
          ref={inputRef}
          onChange={handleFileInputChange}
          className="hidden"
          type="file"
          multiple
          id="file-input"
        />
      </div>
      {/*url input section*/}

      <div className="w-fit m-2 h-fit flex flex-col justify-center items-center gap-2 ">
        <ul>
          {url.length > 0 &&
            url.map((urlItem, index) => {
              return (
                <li
                  key={index}
                  className="w-full h-fit p-2 flex justify-between border border-gray-600 rounded-2xl mb-2"
                >
                  <p>{urlItem}</p>
                  <span
                    onClick={() => {
                      handleRemoveUrl(urlItem);
                    }}
                    className="bold ml-1 cursor-pointer hover:text-red-500 border-[0.5px] border-gray-300 rounded px-2"
                  >
                    x
                  </span>
                </li>
              );
            })}
        </ul>
        <div className="flex gap-4 justify-between">
          <input
            type="text"
            value={currentUrl}
            onChange={(event) => setCurrentUrl(event.target.value)}
            className="w-72  h- border-2 border-gray-600 p-2 "
          ></input>
          <button
            onClick={handleAddUrl}
            className="w-fit h-fit p-2 text-white  bg-green-400 rounded-2xl  hover:bg-green-800 "
          >
            Add URL
          </button>
        </div>
      </div>
      <button
        className={`w-full h-fit p-4 text-white  bg-green-400 rounded-2xl  hover:bg-green-800 ${
          !upload ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        type="submit"
        disabled={!upload}
        onClick={handleUploadResouces}
      >
        Upload
      </button>
    </div>
  );
};

export default FileInput;
