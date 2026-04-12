import { useState } from 'react';
import { Clock, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onGoRegister: () => void;
  error: string | null;
}

export default function LoginPage({ onLogin, onGoRegister, error }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(username, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6DADD1] to-[#4A90D9] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Clock size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">爱时间</h1>
          <p className="text-white/70 mt-2">记录每一刻，掌握每一天</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-2 rounded-xl">{error}</div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名" required minLength={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6DADD1] focus:ring-2 focus:ring-[#6DADD1]/20 outline-none transition-all text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">密码</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码" required minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6DADD1] focus:ring-2 focus:ring-[#6DADD1]/20 outline-none transition-all text-gray-800 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#6DADD1] text-white py-3.5 rounded-xl font-bold text-lg shadow-[0_4px_12px_rgba(109,173,209,0.4)] active:scale-[0.98] transition-transform disabled:opacity-50">
            {loading ? '登录中...' : '登录'}
          </button>
          <div className="text-center pt-2">
            <button type="button" onClick={onGoRegister} className="text-sm text-[#6DADD1] font-medium">
              还没有账号？立即注册
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
