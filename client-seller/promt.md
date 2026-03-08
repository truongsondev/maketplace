# ROLE

- Bạn là một senior frontend chuyên về ReactJS TypeScript

# SCOPE

# CONTEXT

Convert code html sang reactjs

# INSTRUCTION

1.  **Phân tích CONTEXT**:
2.  Đọc hiểu đoạn code sau
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Admin Login | Luxury Fashion Brand</title>
<!-- Tailwind CSS v3 CDN -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Google Fonts for Luxury Feel -->
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&amp;family=Inter:wght@300;400;500;600&amp;display=swap" rel="stylesheet"/>
<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'brand-gold': '#D4AF37',
            'brand-beige': '#F5F5DC',
            'brand-dark': '#1A1A1A',
          },
          fontFamily: {
            serif: ['Bodoni Moda', 'serif'],
            sans: ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
<style data-purpose="custom-typography">
    .luxury-heading {
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    .input-transition {
      transition: all 0.3s ease-in-out;
    }
    .input-transition:focus {
      border-color: #D4AF37 !important;
      box-shadow: 0 0 0 1px #D4AF37;
    }
  </style>
<style data-purpose="layout-adjustments">
    /* Ensuring the split screen fills the viewport */
    .full-height-screen {
      min-height: 100vh;
    }
    /* Overlay effect for the image side */
    .image-overlay {
      background: linear-gradient(rgba(245, 245, 220, 0.4), rgba(245, 245, 220, 0.4));
    }
  </style>
</head>
<body class="font-sans text-brand-dark antialiased bg-white">
<!-- BEGIN: MainContainer -->
<main class="flex flex-col md:flex-row full-height-screen overflow-hidden">
<!-- BEGIN: LeftSection (Visuals) -->
<section class="hidden md:flex md:w-1/2 relative overflow-hidden bg-brand-beige" data-purpose="hero-image-section">
<!-- Background Image -->
<img alt="High-quality fashion model" class="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxl762Bk_kcod5mgxiAzghFxrIFcQkOznl7F3lker5w578fJl0FkqzHBRCvEMYk42h0Vyqx34sLA8LpoR1WT2HJbeimeuUKrf9CQdeFyvU-UKzgya6ccx50youx3zn_B9g29lhsGPMuAPQ1PXu1HXsIW6c7KvKnoy7JjVeeL1_C4pqcy-eurpFMENkBdi_fFVlucS_OyOIwo16wE4KjFwbA9yCu-o4mPeCRyKiMppcYnQcDQmqw6d78xOsxtntP13Ctpqk6fqQPZM"/>
<!-- Beige Soft Overlay -->
<div class="absolute inset-0 image-overlay"></div>
<!-- Minimalist Typography -->
<div class="relative z-10 flex items-center justify-center w-full h-full p-12 text-center">
<h1 class="font-serif text-5xl lg:text-7xl text-brand-dark luxury-heading leading-tight">
          Discover <br/> <span class="italic">Your</span> Style
        </h1>
</div>
</section>
<!-- END: LeftSection -->
<!-- BEGIN: RightSection (Login Form) -->
<section class="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16 lg:p-24 bg-white" data-purpose="login-form-section">
<div class="w-full max-w-md">
<!-- Brand Logo Placeholder -->
<div class="mb-12 text-center" data-purpose="brand-logo">
<h2 class="font-serif text-3xl font-bold luxury-heading tracking-[0.3em]">MAISON</h2>
</div>
<!-- Welcome Heading -->
<div class="mb-10">
<h3 class="text-2xl font-light mb-2">Welcome Back</h3>
<p class="text-gray-500 text-sm">Please enter your credentials to access the dashboard.</p>
</div>
<!-- Login Form -->
<form action="#" class="space-y-6" method="POST">
<!-- Email Input -->
<div class="relative">
<label class="block text-xs uppercase tracking-widest text-gray-400 mb-2" for="email">Email Address</label>
<div class="relative">
<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
<svg class="h-5 w-5" fill="none" stroke="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
</svg>
</span>
<input class="w-full pl-10 pr-4 py-3 border-b border-gray-200 focus:outline-none focus:ring-0 input-transition placeholder-gray-300 bg-transparent" id="email" name="email" placeholder="admin@luxurybrand.com" required="" type="email"/>
</div>
</div>
<!-- Password Input -->
<div class="relative">
<label class="block text-xs uppercase tracking-widest text-gray-400 mb-2" for="password">Password</label>
<div class="relative">
<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
<svg class="h-5 w-5" fill="none" stroke="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
</svg>
</span>
<input class="w-full pl-10 pr-4 py-3 border-b border-gray-200 focus:outline-none focus:ring-0 input-transition placeholder-gray-300 bg-transparent" id="password" name="password" placeholder="••••••••" required="" type="password"/>
</div>
</div>
<!-- Options Row -->
<div class="flex items-center justify-between text-sm">
<div class="flex items-center">
<input class="h-4 w-4 text-brand-dark focus:ring-brand-gold border-gray-300 rounded" id="remember-me" name="remember-me" type="checkbox"/>
<label class="ml-2 block text-gray-600" for="remember-me">Remember me</label>
</div>
<div class="text-sm">
<a class="font-medium text-brand-gold hover:text-yellow-700 transition-colors" href="#">Forgot password?</a>
</div>
</div>
<!-- Action Buttons -->
<div class="pt-4 space-y-4">
<button class="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold text-white bg-brand-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition-all tracking-widest uppercase" type="submit">
              Sign In
            </button>
<!-- Separator -->
<div class="relative my-6">
<div aria-hidden="true" class="absolute inset-0 flex items-center">
<div class="w-full border-t border-gray-100"></div>
</div>
<div class="relative flex justify-center text-xs uppercase">
<span class="bg-white px-2 text-gray-400">Or</span>
</div>
</div>
<!-- Social Login -->
<button class="w-full flex justify-center items-center py-3 px-4 border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all" type="button">
<svg class="w-5 h-5 mr-3" viewbox="0 0 24 24">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
</svg>
              Continue with Google
            </button>
</div>
</form>
<!-- Footer Note -->
<p class="mt-10 text-center text-xs text-gray-400 uppercase tracking-widest">
          © 2024 Luxury Fashion Group. All Rights Reserved.
        </p>
</div>
</section>
<!-- END: RightSection -->
</main>
<!-- END: MainContainer -->
</body></html><!-- MISSING_IMAGES:
- High-quality fashion model photography for the left panel. (Placeholder used: https://placehold.co/1200x1800)
-->

3. Phân tách thành các component hợp lí
4. Khi vào website bắt buộc phải login tại trang này mới được truy cập các url trong web
   API login POST /auth/login {email, password}

# NOTE

- không tạo file .md
