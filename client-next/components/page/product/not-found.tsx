interface NotFoundProps {
  onBack: () => void;
}

export function NotFound({ onBack }: NotFoundProps) {
  return (
    <main className="grow w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600 dark:text-red-400">
            Không tìm thấy sản phẩm
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}
