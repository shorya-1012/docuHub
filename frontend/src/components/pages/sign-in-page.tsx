import { SignIn, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function SignInPage() {

    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    if (isSignedIn) {
        navigate("/");
    }

    return (
        <div className="w-screen min-h-screen bg-dark-body flex justify-center items-center overflow-hidden">
            <SignIn />
        </div>
    )
}
