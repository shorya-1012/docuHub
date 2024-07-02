import { useClerk, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import DownloadButton from "../ui/DownloadButton";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@radix-ui/react-accordion";
import { RiArrowDropDownFill } from "react-icons/ri";

type Document = {
    id: string,
    title: string,
    description: string,
    document_type: string
};


export default function UserProfilePage() {
    const { isSignedIn, user } = useUser();
    const { signOut } = useClerk();

    const navigate = useNavigate();
    console.log(user);

    if (!isSignedIn) {
        navigate("/");
    }

    const { data: documents } = useQuery<Document[]>({
        queryKey: ['getUserDocuments'],
        queryFn: async () => {
            const { data } = await axios.get("/api/get-all-documents")
            console.log(data);
            return data;
        }
    })

    return (
        <div className="w-screen min-h-screen flex flex-col justify-start gap-5 items-center px-5 py-8 bg-zinc-900 text-white overflow-x-hidden">
            <div className="flex flex-col items-center">
                <span className="text-sm">Welcome Back</span>
                <span className="text-2xl font-semibold">{user?.fullName}</span>
                <div className="flex items-center gap-x-3 mt-5">
                    <Button variant={"destructive"} onClick={() => signOut({ redirectUrl: "/" })}>Sign Out</Button>
                    <Button variant={"secondary"} asChild>
                        <Link
                            to={"/upload-document"}
                        >
                            {!documents || documents.length == 0 ?
                                "Get Started" : "Upload Document"
                            }
                        </Link>
                    </Button>
                </div>
            </div>
            {documents && documents.length != 0 &&
                <div className="flex flex-col items-center w-full">
                    <div className="flex flex-col w-full md:w-[70%] p-5 py-3 m-3 gap-8 rounded-xl bg-zinc-800 text-white">
                        <Accordion type="single" collapsible>
                            {documents.map((document, i) => {
                                return (
                                    <AccordionItem
                                        value={document.id}
                                        key={document.id}
                                        className={`${i == documents.length - 1 ? "" : "border-b-[1px] border-black"} px-3 my-2`}
                                    >
                                        <AccordionTrigger className="text-lg font-semibold my-2 flex items-center justify-between w-full">
                                            {document.title}
                                            <RiArrowDropDownFill />
                                        </AccordionTrigger>
                                        <AccordionContent className="">
                                            <div className="flex flex-col items-start my-5">
                                                <p className="text-sm mb-5 bg-zinc-700 p-3 rounded-lg min-h-[100px] w-full md:w-[80%]">
                                                    {document.description}
                                                </p>
                                                <DownloadButton
                                                    documentId={document.id}
                                                    documentName={document.title}
                                                    documentType={document.document_type}
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </div>
                </div>
            }
        </div >
    )
}
