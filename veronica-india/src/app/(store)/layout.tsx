import StoreHeader from "@/components/store/Header";
import StoreFooter from "@/components/store/Footer";
import WhatsAppButton from "@/components/store/WhatsAppButton";

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <StoreHeader />
            <main className="min-h-screen">{children}</main>
            <StoreFooter />
            <WhatsAppButton />
        </>
    );
}
