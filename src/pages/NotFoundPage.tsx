import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
                <ShieldAlert size={40} className="text-red-500" />
            </div>

            <h1 className="text-6xl font-black tracking-tighter mb-4">404</h1>
            <p className="text-neutral-400 max-w-sm mb-10 text-lg">
                The terminal could not locate this sector. It either never existed or was erased from the chronicle.
            </p>

            <button
                onClick={() => navigate('/')}
                className="btn-pill px-8"
            >
                Return to Base
            </button>
        </div>
    );
};

export default NotFoundPage;
