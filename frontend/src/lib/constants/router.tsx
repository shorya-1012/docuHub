import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import HomePage from "../../components/pages/home-page";
import SignInPage from "../../components/pages/sign-in-page";
import UserProfilePage from "../../components/pages/user-profile-page";
import UploadDocumentPage from "../../components/pages/upload-document-page";

export const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path={"/"} element={<HomePage />} />
            <Route path={"/sign-in"} element={<SignInPage />} />
            <Route path={"/my-documents"} element={<UserProfilePage />} />
            <Route path={"/upload-document"} element={<UploadDocumentPage />} />
        </>
    )
)
