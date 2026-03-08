# ROLE

Bạn làm một senior frontend developer chuyên về nextjs
Thành thạo optimal code và reponsive

# SCOPE

# CONTEXT

Chuyển đoạn code sau quan nextjs code

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Neon Graphic T-Shirt - VIBE</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#ee7c2b",
                        "background-light": "#f8f7f6",
                        "background-dark": "#221810",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                },
            },
        }
    </script>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
<!-- Header -->
<header class="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
<div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
<div class="flex items-center justify-between h-16 gap-4">
<!-- Logo & Nav -->
<div class="flex items-center gap-8">
<div class="flex items-center gap-2 text-slate-900 dark:text-white">
<span class="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
<h2 class="text-xl font-bold tracking-tight">VIBE</h2>
</div>
<nav class="hidden md:flex items-center gap-6">
<a class="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors" href="#">New Arrivals</a>
<a class="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors" href="#">Clothing</a>
<a class="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-semibold transition-colors" href="#">Accessories</a>
<a class="text-red-500 hover:text-red-600 text-sm font-semibold transition-colors" href="#">Sale</a>
</nav>
</div>
<!-- Search & Actions -->
<div class="flex items-center gap-4 flex-1 justify-end">
<div class="hidden sm:flex max-w-md w-full relative">
<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
<span class="material-symbols-outlined text-[20px]">search</span>
</div>
<input class="block w-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm" placeholder="Search for products..." type="text"/>
</div>
<div class="flex items-center gap-2">
<button class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
<span class="material-symbols-outlined">shopping_cart</span>
</button>
<button class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
<span class="material-symbols-outlined">person</span>
</button>
<button class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
<span class="material-symbols-outlined">favorite</span>
</button>
</div>
</div>
</div>
</div>
</header>
<main class="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
<!-- Breadcrumb -->
<nav aria-label="Breadcrumb" class="flex mb-8">
<ol class="inline-flex items-center space-x-1 md:space-x-3">
<li class="inline-flex items-center">
<a class="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white" href="#">
                        Home
                    </a>
</li>
<li>
<div class="flex items-center">
<span class="material-symbols-outlined text-slate-400 text-sm mx-1">chevron_right</span>
<a class="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white" href="#">Tops</a>
</div>
</li>
<li aria-current="page">
<div class="flex items-center">
<span class="material-symbols-outlined text-slate-400 text-sm mx-1">chevron_right</span>
<span class="text-sm font-medium text-slate-900 dark:text-white">Neon Graphic T-Shirt</span>
</div>
</li>
</ol>
</nav>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
<!-- Product Gallery -->
<div class="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
<!-- Thumbnails -->
<div class="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 md:h-[600px] scrollbar-hide">
<button class="relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border-2 border-primary">
<img alt="Thumbnail 1" class="w-full h-full object-center object-cover" data-alt="Close up of white t-shirt fabric texture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_qlJAEPDJ5vVTaVxCEJ9qDJR_GN-fVtj-9yv5LTcG3Eb6kQy6G8Fm4aHC5TUwHsQSBGRt7_TCyPHkoLgNr6N_bKQ8V0NpQ1TL89xaHifa2vTJyKII_Utq8ztLs6H_dgaz5A8wk3pJvWOGDzbDsGk-6SOUgTO6rSG8MjB4VkxmlK9zVzPZ9ZYZq2gHub2bTsj3aPdfI833cr3Ksg9WMcZvPTHCd9tyy3x5KwSAgxCVhEu6MJwrO8mcI5R32lRu9ChFqjGIZMfNMeo"/>
</button>
<button class="relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
<img alt="Thumbnail 2" class="w-full h-full object-center object-cover" data-alt="Man wearing white t-shirt front view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJB6EAxOnPdfurq229bAP7wXSdn6uC0rvdApiOWlTSxS5dYzHS44qVO4HPpU4cVtgOOctsMsi8uFCwensQNr7X9KAmEhIUawxExFx-noGi7VoROcqTY8p5w_kNB_EWtVHB0swQP02Jx-f1YtFjcnlcU5e19Nihpc6iibZfbWicef4gER4xEGnNSuEZ8Jo8Rt5whv36x3r6t1Ip_Qo4hXUZ7ZGCEK_CSi41wJiihg7A8_hkXJOMdpYaaiJ37nIymTU4gDDpuzsA7HM"/>
</button>
<button class="relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
<img alt="Thumbnail 3" class="w-full h-full object-center object-cover" data-alt="Man wearing white t-shirt back view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgH7-nyZ3W80DG6OI7ODZ7PhxvdU1BP_ifUJWSZp3QhICqv1yCe5Df2TZ2NGs4nijlDOLA9ROya2yBiqfmE09ohg6EbnzwHMZXPf9pwWLquNFTl_BFrUgWk_D1BPJ7_jzQkChWzY-izRwffsLSSvW0EVsurvoO4hhmMcBA3V8eLkN66sRBG1iJc_TNMmi9nqYGo847wL5Fh3g04bGUa4mePTbf8yj3cHVjKdrlOn_yAJMm77QNPplhXs61nrrmSbaNYpmz6MVsYn0"/>
</button>
<button class="relative flex-shrink-0 w-20 h-24 md:w-full md:h-24 rounded-lg overflow-hidden border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
<img alt="Thumbnail 4" class="w-full h-full object-center object-cover" data-alt="Model posing in white t-shirt in street" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcquwPK8HtOnOWoKq-7hIJ_f92LbUbeYwPkayEwqTAys7XK0S4ErnAZE1zKuxGSbmmZhiHyWamU2t_P6P-Q03x5ZrQFcEGp1KBILkzvYTjJkt1RR7kgbKnq7stDTekiYyVZqTYHafywLsCiqcy3GkcDYI0ANkpS97qypTPk2gkU6GlOHb8urGFqqB30WDGZlkjKzkjxU_-XdZuuqExsdy25i8S_yAHXMIfBg7eiOOnrF8chxhwm3Jrdv3cBLz1HoML5IAs8ounpE0"/>
</button>
</div>
<!-- Main Image -->
<div class="flex-1 relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-[4/5] md:aspect-auto md:h-[600px] group">
<img alt="Main Product Image" class="w-full h-full object-center object-cover" data-alt="White graphic t-shirt on a hanger" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZQGzZZALHmXSICN2lCQDf9W-_GfcooQ6oyYBNgSc1a_QG_tDYD66DoF4xtzxWo_Ro15_uq4Eu8bB1WoT0i1Y252dHlmmOs8AopAOvc98Wve7gtYN7hk0HcWtGO_2HG7YPrCLVGK8mJG-wO18Xrm1j-e5kNAlLQIsRKGvB89BjJIs87V7TaQMhuBC6Esiceqb5d5UMgAxTe3kg53odoUBfP9-GGPZBKz1m3fswA0SFrn9hb3eheGOyL_52gCsFQb0DXHgCdV2tQY4"/>
<button class="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
<span class="material-symbols-outlined text-slate-900 dark:text-white">zoom_in</span>
</button>
<div class="absolute top-4 left-4">
<span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">20% OFF</span>
</div>
</div>
</div>
<!-- Product Info -->
<div class="lg:col-span-5 flex flex-col gap-6">
<div>
<h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Neon Graphic T-Shirt</h1>
<div class="flex items-center gap-4 mb-4">
<div class="flex items-center text-yellow-400 gap-0.5">
<span class="material-symbols-outlined text-lg fill-current">star</span>
<span class="material-symbols-outlined text-lg fill-current">star</span>
<span class="material-symbols-outlined text-lg fill-current">star</span>
<span class="material-symbols-outlined text-lg fill-current">star</span>
<span class="material-symbols-outlined text-lg fill-current text-slate-300">star</span>
</div>
<span class="text-sm text-slate-500 dark:text-slate-400 font-medium">4.8 (124 reviews)</span>
</div>
<div class="flex items-end gap-3">
<p class="text-3xl font-bold text-primary">$29.99</p>
<p class="text-xl text-slate-400 line-through mb-1">$37.50</p>
</div>
</div>
<div class="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
<!-- Color Selection -->
<div>
<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Color: <span class="text-slate-500 font-normal">White</span></h3>
<div class="flex items-center gap-3">
<button class="w-10 h-10 rounded-full bg-white border-2 border-primary shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark"></button>
<button class="w-10 h-10 rounded-full bg-slate-900 border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-105 transition-transform"></button>
<button class="w-10 h-10 rounded-full bg-blue-600 border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-105 transition-transform"></button>
<button class="w-10 h-10 rounded-full bg-green-500 border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-105 transition-transform"></button>
</div>
</div>
<!-- Size Selection -->
<div>
<div class="flex items-center justify-between mb-3">
<h3 class="text-sm font-semibold text-slate-900 dark:text-white">Size: <span class="text-slate-500 font-normal">M</span></h3>
<button class="text-sm font-medium text-primary hover:text-orange-600 underline decoration-dashed underline-offset-4">Size Guide</button>
</div>
<div class="grid grid-cols-4 gap-3">
<button class="h-12 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium hover:border-slate-400 dark:hover:border-slate-500 transition-colors">S</button>
<button class="h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent rounded-lg font-bold shadow-lg shadow-slate-200 dark:shadow-none">M</button>
<button class="h-12 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium hover:border-slate-400 dark:hover:border-slate-500 transition-colors">L</button>
<button class="h-12 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium hover:border-slate-400 dark:hover:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled="">XL</button>
</div>
</div>
<!-- Quantity & Actions -->
<div class="flex flex-col gap-4 mt-2">
<div class="flex gap-4">
<!-- Stepper -->
<div class="flex items-center h-14 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 w-32">
<button class="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm">remove</span>
</button>
<input class="flex-1 w-full text-center bg-transparent border-none text-slate-900 dark:text-white font-semibold focus:ring-0 p-0" readonly="" type="text" value="1"/>
<button class="w-10 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm">add</span>
</button>
</div>
<!-- Add to Cart -->
<button class="flex-1 h-14 bg-primary hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
<span class="material-symbols-outlined">shopping_bag</span>
                            Add to Cart
                        </button>
<!-- Wishlist -->
<button class="h-14 w-14 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-200 bg-white dark:bg-slate-800 transition-colors group">
<span class="material-symbols-outlined group-hover:fill-current">favorite</span>
</button>
</div>
<button class="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Buy Now
                    </button>
</div>
<!-- Info Cards -->
<div class="grid grid-cols-2 gap-4 mt-4">
<div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
<span class="material-symbols-outlined text-primary">local_shipping</span>
<div>
<p class="text-sm font-bold text-slate-900 dark:text-white">Free Shipping</p>
<p class="text-xs text-slate-500">On orders over $50</p>
</div>
</div>
<div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
<span class="material-symbols-outlined text-primary">verified_user</span>
<div>
<p class="text-sm font-bold text-slate-900 dark:text-white">Secure Payment</p>
<p class="text-xs text-slate-500">100% Protected</p>
</div>
</div>
</div>
</div>
</div>
<!-- Details Tabs -->
<div class="mt-20">
<div class="border-b border-slate-200 dark:border-slate-700">
<nav aria-label="Tabs" class="-mb-px flex space-x-8">
<button class="border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm">
                        Description
                    </button>
<button class="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Material &amp; Care
                    </button>
<button class="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Shipping &amp; Returns
                    </button>
<button class="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Reviews (124)
                    </button>
</nav>
</div>
<div class="py-8 text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
<p class="mb-4">
                    Elevate your casual wardrobe with our Neon Graphic T-Shirt. Designed for the bold and the spirited, this tee features a striking neon graphic print that pops against the premium cotton fabric. Whether you're hitting the streets or lounging at home, the relaxed fit ensures maximum comfort without compromising on style.
                </p>
<ul class="list-disc pl-5 space-y-2 mb-4">
<li>Premium 100% cotton jersey fabric for softness and breathability.</li>
<li>Ribbed crew neck retains shape after washing.</li>
<li>Double-needle stitching on sleeves and bottom hem for durability.</li>
<li>Modern relaxed fit, true to size.</li>
</ul>
</div>
</div>
<!-- Related Products -->
<div class="mt-16 mb-20">
<h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-8">You May Also Like</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
<!-- Product Card 1 -->
<div class="group relative">
<div class="aspect-[1/1] w-full overflow-hidden rounded-lg bg-gray-200 relative">
<img alt="Related Product 1" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" data-alt="Man in grey hoodie" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFr88gXzEfODz70VkDIZPineOxWxI0QVLeIS9RZxKfgPu1WDD6W0UAY8E9pe_X66g3aIQAGTziwu52kRvMfrAzCRuEu8wMH9WaFHgtBIiyxVCMhd832G5sbOREVj8iivv0_hQxyCiQOrucZ9zqj1H8mUIoKpmlnjJ6kuoczc-ikr3S_XTNbjbcEyirLzkmSHdpgoIVQPlLiTCzAJY5V6kX99PGWk95tLYw45I9ETPMdoG3DAou4zaGCCzqTb5z_Rjtu1qvTb1-9oI"/>
<button class="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
<div class="mt-4 flex justify-between">
<div>
<h3 class="text-sm font-bold text-slate-900 dark:text-white">
<a href="#">
<span aria-hidden="true" class="absolute inset-0"></span>
                                    Urban Hoodie
                                </a>
</h3>
<p class="mt-1 text-sm text-slate-500">Heather Grey</p>
</div>
<p class="text-sm font-bold text-slate-900 dark:text-white">$45.00</p>
</div>
</div>
<!-- Product Card 2 -->
<div class="group relative">
<div class="aspect-[1/1] w-full overflow-hidden rounded-lg bg-gray-200 relative">
<img alt="Related Product 2" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" data-alt="Folded stack of colorful t-shirts" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzawDj66oPyB_bxuWNh8CkcET8xBI7a-OQRdPj76NCEwF7N3KRvEXlAXG4XUpwHXUEXaxC5UtwH10Ad-SLmvClbt-JVcFasUxVuHUpNfBBlxG4PiVtz9z4YGkxrz25QIGS3DhcCfW3dX9VFkXngRKCUfLgd6B5Q0YxORACxXQgGP1c48INNrs5hPaKAd4w7QUoWVtrh1jGkfop8DpMFU9ZTfqsBLS2iKRx-BV8IjFs6QTL_Ppu_yuoM9S3vzDsoW66TrHhJy5zJFU"/>
<button class="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
<div class="mt-4 flex justify-between">
<div>
<h3 class="text-sm font-bold text-slate-900 dark:text-white">
<a href="#">
<span aria-hidden="true" class="absolute inset-0"></span>
                                    Basic Crew Tee
                                </a>
</h3>
<p class="mt-1 text-sm text-slate-500">Navy Blue</p>
</div>
<p class="text-sm font-bold text-slate-900 dark:text-white">$18.00</p>
</div>
</div>
<!-- Product Card 3 -->
<div class="group relative">
<div class="aspect-[1/1] w-full overflow-hidden rounded-lg bg-gray-200 relative">
<img alt="Related Product 3" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" data-alt="Denim jacket on hanger" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4AwZoskYTp-oTyP4PoDqpOH01GFopjqkcNmIOUOJSQzLp1tMeBRlLNf5GDdu6QQOurEPoxsF5U_aAc8UDl3YDFQpoi6CUm_uV-HTIr_Zxw1Oegr0Zbjxvzn3mP3Z5mtODH287xPEvnPN2cfNDkANx_awWwdblQhAU6x2T-lzZYrkGGD-reQ0od7dhZSHBavvHUV_bSTQ9laLKTAtNMVM7ISmkqIo4iCTNiQDancgIGiiUgGeNFWiNBucj6_bujKeOtBP-weZRorA"/>
<div class="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">NEW</div>
<button class="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
<div class="mt-4 flex justify-between">
<div>
<h3 class="text-sm font-bold text-slate-900 dark:text-white">
<a href="#">
<span aria-hidden="true" class="absolute inset-0"></span>
                                    Vintage Denim Jacket
                                </a>
</h3>
<p class="mt-1 text-sm text-slate-500">Light Wash</p>
</div>
<p class="text-sm font-bold text-slate-900 dark:text-white">$89.00</p>
</div>
</div>
<!-- Product Card 4 -->
<div class="group relative">
<div class="aspect-[1/1] w-full overflow-hidden rounded-lg bg-gray-200 relative">
<img alt="Related Product 4" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" data-alt="Abstract colorful patterned shirt" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOEDVKE7sU6ryaYRclCxu32ZqXg1hLvDCLhOgJUE6aJywpdCJXdNflbcJlLOqhBve0gj8KxMEsCkfjut_OdoZdZvp0folYDMyTPK_KvpwSWDV7-LXF-opHkV4wqQ0Tv4teE_3Jh8BPtw_7g7opB8wiYPP0ggXgY4nWsT_SGAdA2XOX5K3NuuDi9r2wZgtEhCZ7W2ogFphmnJUZZcYxFuuS4znhCw6lyQeJFHCcF9rIBIirdLCNokTLho3qzA8_-beBVJqiYFKxEUA"/>
<button class="absolute top-3 right-3 p-2 bg-white/80 rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
<div class="mt-4 flex justify-between">
<div>
<h3 class="text-sm font-bold text-slate-900 dark:text-white">
<a href="#">
<span aria-hidden="true" class="absolute inset-0"></span>
                                    Abstract Print Shirt
                                </a>
</h3>
<p class="mt-1 text-sm text-slate-500">Multi</p>
</div>
<p class="text-sm font-bold text-slate-900 dark:text-white">$34.00</p>
</div>
</div>
</div>
</div>
</main>
<!-- Simple Footer -->
<footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
<div class="max-w-[1440px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
<div class="md:flex md:items-center md:justify-between">
<div class="flex justify-center md:order-2 gap-6">
<a class="text-slate-400 hover:text-primary" href="#">
<span class="sr-only">Facebook</span>
<svg aria-hidden="true" class="h-6 w-6" fill="currentColor" viewbox="0 0 24 24">
<path clip-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill-rule="evenodd"></path>
</svg>
</a>
<a class="text-slate-400 hover:text-primary" href="#">
<span class="sr-only">Instagram</span>
<svg aria-hidden="true" class="h-6 w-6" fill="currentColor" viewbox="0 0 24 24">
<path clip-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h-.165zm0 2.16c-2.367 0-2.668.01-3.66.055-.99.045-1.528.21-1.89.352-.475.185-.815.406-1.17.761-.355.355-.576.695-.761 1.17-.142.362-.307.9-.352 1.89-.045.992-.055 1.293-.055 3.66v.165c0 2.367.01 2.668.055 3.66.045.99.21 1.528.352 1.89.185.475.406.815.761 1.17.355.355.695.576 1.17.761.362.142.9.307 1.89.352.992.045 1.293.055 3.66.055h.165c2.367 0 2.668-.01 3.66-.055.99-.045 1.528-.21 1.89-.352.475-.185.815-.406 1.17-.761.355-.355.576-.695.761-1.17.142-.362.307-.9.352-1.89.045-.992.055-1.293.055-3.66v-.165c0-2.367-.01-2.668-.055-3.66-.045-.99-.21-1.528-.352-1.89-.185-.475-.406-.815-.761-1.17-.355-.355-.695-.576-1.17-.761-.362-.142-.9-.307-1.89-.352-.992-.045-1.293-.055-3.66-.055h-.165zm-4.47 2.162h2.99a2.16 2.16 0 11-2.99 0zM12 7.16a4.84 4.84 0 100 9.68 4.84 4.84 0 000-9.68z" fill-rule="evenodd"></path>
</svg>
</a>
</div>
<div class="mt-8 md:mt-0 md:order-1">
<p class="text-center text-base text-slate-400">© 2023 VIBE Fashion, Inc. All rights reserved.</p>
</div>
</div>
</div>
</footer>
</body></html>
# INSTRUCTION

1. Đọc yêu cầu trong **<CONTEXT>**
2. Chuyển text qua tiếng việt
