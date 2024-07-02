import { Button } from "./button";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

type Props = {
    documentId: string
    documentType: string
    documentName: string
}

export default function DownloadButton({ documentId, documentType, documentName }: Props) {
    const { mutate: handleDownload, isPending } = useMutation({
        mutationFn: async (e: any) => {
            e.preventDefault();

            const { data } = await axios.get("/api/get-download-url", {
                params: {
                    id: documentId
                }
            });

            const signedUrl = data.presigned_url;

            const response = await axios({
                url: signedUrl,
                method: 'GET',
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${documentName}.${documentType}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        },
        onError: (error) => {
            console.log(error);
            alert("Something went wrong");
        }
    })

    return (
        <Button
            onClick={handleDownload}
            variant={"ghost"}>
            {isPending ? "Downloading..." : "Download"}
        </Button>
    )
}
