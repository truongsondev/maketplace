export function LetterSession() {
  return (
    <section className="relative my-10 py-16">
      <div className="absolute inset-0 -skew-y-2 bg-[#ee7c2b]/10 dark:bg-primary/5"></div>

      <div className="layout-container relative mx-auto flex max-w-240 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
          <span className="material-symbols-outlined text-3xl">mail</span>
        </div>

        <h2 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">
          Tham gia VIBE Club
        </h2>

        <p className="mb-8 max-w-md text-neutral-600 dark:text-neutral-400">
          Nhận giảm giá 15% cho đơn hàng đầu tiên và cập nhật sớm nhất về các
          sản phẩm mới và ưu đãi độc quyền.
        </p>

        <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="Nhập email của bạn"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          />

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Đăng ký ngay
          </button>
        </form>
      </div>
    </section>
  );
}
