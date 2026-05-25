import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="mb-4 text-9xl font-extrabold text-blue-600">404</h1>
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Сторінку не знайдено</h2>
      <p className="mb-8 text-gray-500 max-w-md">
        Здається, ви перейшли за неправильним посиланням, або цієї сторінки більше не існує.
      </p>
      <Button onClick={() => navigate('/')} className="px-8 py-3">
        Повернутися на головну
      </Button>
    </div>
  );
}
