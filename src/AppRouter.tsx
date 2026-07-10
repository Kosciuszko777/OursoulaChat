import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Landing from "./pages/Landing";
import AppShell from "./pages/AppShell";
import ChatEmpty from "./pages/ChatEmpty";
import ChatView from "./pages/ChatView";
import GroupChatView from "./pages/GroupChatView";
import AppSettings from "./pages/AppSettings";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Educational landing page */}
        <Route path="/" element={<Landing />} />

        {/* App shell with sidebar + content area */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<ChatEmpty />} />
          <Route path="chat/:npub" element={<ChatView />} />
          <Route path="group/:id" element={<GroupChatView />} />
          <Route path="settings" element={<AppSettings />} />
        </Route>

        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
