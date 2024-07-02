import { IoIosCloudUpload } from "react-icons/io";
import DocuHubLogo from "../ui/DocuHubLogo";
import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function UploadDocumentPage() {

    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | undefined>();
    const [documentId, setDocumentId] = useState("");

    const { mutate: handleSubmit, isPending } = useMutation({
        mutationFn: async (e: any) => {
            e.preventDefault();

            if (!title || !description) {
                alert("title or description not provided");
                return;

            }

            if (!file?.size || !file.type) {
                alert("File size or file type not provided");
                return;
            }

            const getSignedUrlPayload = {
                title: title,
                description: description,
                document_type: file.type,
                document_size: file.size,
            }

            const { data } = await axios.post("/api/get-signed-url", getSignedUrlPayload);

            const document_id = data.document_id;
            setDocumentId(document_id);

            const presigned_url = data.presigned_url;

            await axios.put(presigned_url, file, {
                headers: {
                    'Content-Type': file.type
                }
            })

        },
        onSuccess: async () => {
            alert("file uploaded sucessfully");
            navigate("/my-documents");
        }, onError: async (_error) => {
            if (documentId !== "") {
                await axios.delete("/api/delete-db-record", {
                    params: {
                        id: documentId
                    }
                })
            }
            alert("Something went wrong");
            navigate("/my-documents");
        }
    })

    const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        const uploadedFile = e.target.files?.[0];
        setFile(uploadedFile);
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="max-w-lg w-full h-[80vh] bg-white p-6 rounded-lg shadow-md flex flex-col justify-center">
                <DocuHubLogo styles="text-lg md:text-2xl" />

                <form className="space-y-8">
                    <div>
                        <label htmlFor="documentName" className="block text-sm font-medium text-gray-700">Document Name</label>
                        <input type="text" id="title"
                            name="documentName"
                            className="mt-1 w-full border-gray-300 border-[1px] rounded-xl shadow-xl py-3 px-2 flex items-start"
                            placeholder="Enter document name"
                            onChange={(e) => (setTitle(e.target.value))}
                        />
                    </div>

                    {!file &&
                        <div className="flex items-center space-x-2 justify-center w-full">
                            <label htmlFor="document" className="block text-sm font-medium text-gray-700 w-full">
                                <span className="ml-2">Upload Your Document</span>
                                <div className="inline-flex flex-col items-center justify-center h-[100px] w-full bg-gray-200 rounded-md">
                                    <span>Upload Document</span>
                                    <IoIosCloudUpload className="h-6 w-6 text-gray-500" />
                                </div>
                            </label>
                            <input
                                type="file"
                                id="document"
                                name="image"
                                accept="image/*, .pdf"
                                className="hidden"
                                onChange={handleFileUploadChange}
                            />
                        </div>
                    }

                    {file &&
                        <div className="flex flex-col items-center space-x-2 justify-center w-full">
                            File selected to be uploaded
                        </div>
                    }

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (optional)</label>
                        <textarea id="description"
                            name="description"
                            rows={3}
                            className="mt-1 w-full border-gray-300 border-[1px] rounded-xl shadow-xl py-3 px-2 flex items-start"
                            placeholder="Add some description about your document"
                            onChange={(e) => (setDescription(e.target.value))}
                        />
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={(e) => handleSubmit(e)}
                            disabled={isPending}
                            type="submit" className="w-full inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                            {isPending ? "Loading.." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
