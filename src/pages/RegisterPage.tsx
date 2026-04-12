import { useState } from 'react';
import { Clock, Eye, EyeOff } from 'lucide-react';

interface RegisterPageProps {
  onRegister: (username: string, password: string) => Promise<void>;
  onGoLogin: () => void;
  error: string | null;
}

export default function RegisterPage({ onRegister, onGoLogin, error }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('两次密码不一致');
      return;
    }
    if (password.length < 6) {
      setLocalError('密码至少6个字符');
      return;
    }

    setLoading(true);
    try {
      await onRegister(username, password);
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6DADD1] to-[#4A90D9] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Clock size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">创建账号</h1>
          <p className="text-white/70 mt-2">开始记录你的时间</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          {displayError && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-2 rounded-xl">{displayError}</div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="至少3个字符" required minLength={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6DADD1] focus:ring-2 focus:ring-[#6DADD1]/20 outline-none transition-all text-gray-800" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">密码</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6个字符" required minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6DADD1] focus:ring-2 focus:ring-[#6DADD1]/20 outline-none transition-all text-gray-800 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">确认密码</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6DADD1] focus:ring-2 focus:ring-[#6DADD1]/20 outline-none transition-all text-gray-800" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#6DADD1] text-white py-3.5 rounded-xl font-bold text-lg shadow-[0_4px_12px_rgba(109,173,209,0.4)] active:scale-[0.98] transition-transform disabled:opacity-50">
            {loading ? '注册中...' : '注册'}
          </button>
          <div className="text-center pt-2">
            <button type="button" onClick={onGoLogin} className="text-sm text-[#6DADD1] font-medium">已有账号？去登录</button>
          </div>
        </form>
      </div>
    </div>
  );
}
