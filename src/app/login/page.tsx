import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <div className="flex w-full items-end rounded-lg bg-zinc-900 p-3 md:h-36">
                    <div className="w-32 text-white md:w-36">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 mb-2"></div>
                        <p className="font-bold text-xl">TuPichanga</p>
                    </div>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
