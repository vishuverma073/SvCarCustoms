import StoreHeader from "@/components/store/Header";
import StoreFooter from "@/components/store/Footer";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import RecentPurchaseToast from "@/components/store/RecentPurchaseToast";
import AnalyticsTracker from "@/components/store/AnalyticsTracker";
import AuthProvider from "@/components/auth/AuthProvider";

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <StoreHeader />
            <main className="min-h-screen">{children}</main>
            <StoreFooter />
            <WhatsAppButton />
            <RecentPurchaseToast />
            <AnalyticsTracker />
        </AuthProvider>
    );
}
