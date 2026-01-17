interface FlashSaleItem {
  id: number;
  image: string;
  price: number;
  discount: number;
  soldPercentage: number;
}

const flashSaleItems: FlashSaleItem[] = [
  {
    id: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDzw7PTXcO8552oZiTe_qIegYHCcZSNNkAhyrZStqhJoe6YWtw0GI_pvPkquvjpfj5k1RwqRlddLISNLWrIPzyc6zRIqJDpD7ADqBw1_751bkooh884Jb3RthDTZ6ftLvSYN--2PuMACF7kKtVHhkTwv_2PvCxzu-8tHI7q_Pn4kGetylNSFFaTF1mTOu4yXXvIJfegafKezIc6NwiIcFuxwMNfZAhXPz5m_xSJzRhHg0i3UKgwswx9hazUwj4ycIDlhauGxT4ALnlX",
    price: 499,
    discount: 45,
    soldPercentage: 85,
  },
  {
    id: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBjSW8FJI-lfVoPCJTJZdvbBPBfaJg7XWIhdBPwswx_cbBM6Gtf_Mt9OCHFOp_1o2IbDzBEi7cUAmFMpS5Nzy68bsXTaoHkVyf5jnUjrrRmsNBAfpMYxfJQ5VOGxjLPyiJmb15sCQljCmB97YFVA4dVCN_KLXTxOGhg5-iz2o42Bdzqps21ZUfnIABgrruTnt_Ow_mnwqnrxFrH7-R1qEMlUCdHnPcuZ5UjL7ELf0Sf0TlbkhEF3yYjCbg9FI6uEgdN4tuK2eX2rVQq",
    price: 120,
    discount: 20,
    soldPercentage: 40,
  },
  {
    id: 3,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCooPRHH8-YOOkaXDn1NpVMLrE2YqzsXz8HFLJ2JBu3YcnRYAhaNroEPES54iqbtJ0mAa2i6JkzEZdnD5SFfOMUR7RsG4GKATbQyzcoy-XWc-GtMGrYmI6d3YAFzxz4Z41r7TaLOn1xPXh--nLEvDAGD6U3BZn8YbACFTeqRM2lMsgJC39r87S6gOZqEG9YZWsFMCCNl33GDKNVf0isnKXc7N-5zS0xuho8CjGVWIPKBgzAv_mekr8xVT0RIE_LhXRq0DRYJi4wXzp9",
    price: 89,
    discount: 30,
    soldPercentage: 95,
  },
  {
    id: 4,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtKCoI8Ris5ssy6VOj1xEtQcF_YEurXA4VOOQA54PRMx6dG3hAavCIrm2Cw0HqFjRkrQhPPnFx0XIA9ZjZTMgIXr5fL6TpYsAUbP6USqBIYVjS2Zu_h06ibybwyyUkHSSFXHXVzR9Mu_FKUfIZ_NffUwJDNCnykPl8Xs4GbohwVhduIJ78QBSJh8ysaQRBFjrruAUyeB1uYMOeKPhSTP4MUAhdRbrVYhKGPfeLgBb5UDTA_MQkaKHDzMCaBUt93HzQmi8_n9vm4ayr",
    price: 65,
    discount: 15,
    soldPercentage: 60,
  },
  {
    id: 5,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMgNCVpWFI5yFM-ud7b7xNvGfftdxmTMJdYhn4LMGw5268STROPm8MPhyLkWnES7yX7SKCl4b-h60GjE8xBr5J4IzgVqAI5fmWjv5el2lhqeTfsgUGRQuBDpZtnTGYD8eyw5OeN4nrHomgMevjpExRbTVrUHZeemPwIJIQ_xObeQ3SCaM6lGbBu8ICvXVBl65qsrfjXyd3g5VQxcjqfnkNDqv5uWdhcSxrPm8cq1-4V_aU7DeMAUQBAvympzJknojNnfHVXGgRnmld",
    price: 45,
    discount: 50,
    soldPercentage: 30,
  },
  {
    id: 6,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCix46988Mzenl4WizOMJpvVxjAVzIewEprg8DJk1qvEY5Y9y1VT2ao6uWb1pO--baull1KGF1TtFsOVFfUCQ7x0r0kYyMyboWWmT2QkDzR0rwTkupP6EyKgiJc_YVWRaUiBSsHkFOjBh8U6vhsUCPd36bTtgCoF1OluMS35d7LTCpO-dK-QgnRt1gFE2-sPRx2YwxvmBUCpzX5zRt_ZswJgSlw9CgcdHGAInuScRuNCIrZq0j5mdS2EtYY50igyOzqVVkSPMxQKZP3",
    price: 35,
    discount: 10,
    soldPercentage: 10,
  },
];

export function FlashSaleSection() {
  return (
    <section className="bg-card dark:bg-background-dark/50 rounded-lg p-6 mb-8 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">
            Flash Sale
          </h3>
          <div className="flex gap-2 items-center">
            <span className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-2 py-1 rounded">
              02
            </span>
            <span className="font-bold">:</span>
            <span className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-2 py-1 rounded">
              45
            </span>
            <span className="font-bold">:</span>
            <span className="bg-black dark:bg-white text-white dark:text-black text-sm font-bold px-2 py-1 rounded">
              12
            </span>
          </div>
        </div>
        <a
          className="text-primary font-bold flex items-center gap-1 hover:underline"
          href="#"
        >
          View All{" "}
          <span className="material-symbols-outlined text-sm">
            arrow_forward_ios
          </span>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {flashSaleItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 group cursor-pointer"
          >
            <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
              <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 z-10">
                -{item.discount}%
              </div>
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform"
                style={{ backgroundImage: `url("${item.image}")` }}
              ></div>
            </div>
            <div className="px-1">
              <p className="text-primary font-bold text-lg mb-1">
                ${item.price.toFixed(2)}
              </p>
              <div className="w-full bg-muted dark:bg-white/10 h-3.5 rounded-full relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-primary"
                  style={{ width: `${item.soldPercentage}%` }}
                ></div>
                <span className="absolute inset-0 text-[9px] text-white font-bold flex items-center justify-center uppercase">
                  {item.soldPercentage}% Sold
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
