interface NotFoundProps {
  onBack: () => void;
}

export function NotFound({ onBack }: NotFoundProps) {
  return (
    <main className="grow w-full max-w-330 mx-auto px-4 sm:px-6 lg:px-8 py-8 text-[#222222] dark:text-neutral-100">
      <div className="flex items-center justify-center min-h-100">
        <div className="flex flex-col items-center gap-4 rounded-sm border border-neutral-200 bg-white px-8 py-10 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-neutral-700 dark:text-neutral-200">
            Không tìm thấy sản phẩm
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-black text-white rounded-sm hover:bg-neutral-800 transition-colors"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}
