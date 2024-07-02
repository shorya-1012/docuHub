import { SignedIn, SignedOut } from "@clerk/clerk-react"
import { AuroraBackground } from "../ui/aurora-background"
import DocuHubLogo from "../ui/DocuHubLogo"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

export default function HomePage() {

    return (
        <AuroraBackground>
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="relative flex flex-col gap-4 items-center justify-center px-4"
            >
                <div className="flex items-center">
                    <div className="text-3xl md:text-7xl font-bold dark:text-white text-nowrap">
                        Welcome to&nbsp;
                    </div>
                    <DocuHubLogo styles="text-3xl md:text-7xl" />
                </div>
                <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
                    A place to upload and access your Documents
                </div>
                <SignedIn>
                    <Link to={"/my-documents"}
                        className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
                        View Your Documents
                    </Link>
                </SignedIn>
                <SignedOut>
                    <Link to={"/sign-in"}
                        className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2">
                        Sign in
                    </Link>
                </SignedOut>
            </motion.div>
        </AuroraBackground>
    )
}
