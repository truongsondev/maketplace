
const { chromium } = require('playwright');
const fs = require('fs');
const outDir = 'docs/ui-screenshots';
fs.mkdirSync(outDir, { recursive: true });
const now = new Date().toISOString();
const img = {
  shirt:'https://res.cloudinary.com/dwqifbxzr/image/upload/v1776500698/products/products/ebdu9bnkjjfza0kp1wud.webp',
  pants:'https://res.cloudinary.com/dwqifbxzr/image/upload/v1777186525/products/products/vjykuz4lhir7vkbajwve.webp',
  bag:'https://res.cloudinary.com/dwqifbxzr/image/upload/v1777184280/products/products/gseewqrwatjgkmyguxss.webp'
};
const products = [
 {id:'3513caa9-8196-4c13-98ad-ab930000b4ac',name:'Quần Jean Vải Mềm Co Giãn Thoải Mái FlexFit™',slug:'quan-jean-vai-mem-co-gian-thoai-mai-flexfittm',imageUrl:img.pants,minPrice:3000,isNew:false,isSale:false},
 {id:'c1eac83b-f93d-43da-82a6-7c5a8b3a2208',name:'Túi Đeo Chéo Cross Bag',slug:'tui-deo-cheo-cross-bag',imageUrl:img.bag,minPrice:2500,isNew:false,isSale:false},
 {id:'a30301a7-e795-4972-a317-9ce06db9780a',name:'Áo Sơ Mi Tay Dài Vải Ngải Cứu StayFresh',slug:'ao-so-mi-tay-dai-vai-ngai-cuu-stayfresh',imageUrl:img.shirt,minPrice:2000,isNew:false,isSale:false}
];
const api = (data)=>({success:true,data,message:'OK',timestamp:now});
const cart = {cartId:'cart-demo',totalItems:2,totalQuantity:3,totalAmount:8000,items:[
 {itemId:'ci1',productId:products[0].id,productName:products[0].name,variantId:'v1',variantSku:'JEAN-001',variantAttributes:{size:'M',color:'Đen'},quantity:2,availableStock:17,maxAllowedQuantity:17,unitPrice:3000,subtotal:6000,image:{url:img.pants,altText:products[0].name}},
 {itemId:'ci2',productId:products[2].id,productName:products[2].name,variantId:'v3',variantSku:'SOMI-HEAD-002',variantAttributes:{size:'XL',color:'Trắng'},quantity:1,availableStock:9,maxAllowedQuantity:9,unitPrice:2000,subtotal:2000,image:{url:img.shirt,altText:products[2].name}}
]};
const adminProductItems = products.map((p,i)=>({id:p.id,name:p.name,basePrice:p.minPrice,status:'active',createdAt:i===2?'2026-04-18T00:00:00Z':'2026-04-26T00:00:00Z',updatedAt:now,primaryImage:{id:'im'+i,url:p.imageUrl,altText:p.name,sortOrder:0,isPrimary:true,variantId:null},variantsSummary:{count:i===2?3:1,priceRange:{min:p.minPrice,max:p.minPrice},totalStock:[17,4,14][i],lowStockCount:i===2?1:0},categories:[{id:'cat',name:i===1?'Túi đeo chéo (cross bag)':i===0?'Quần jeans slim fit':'Áo sơ mi tay dài',slug:'cat',description:'',imageUrl:null,parentId:null,sortOrder:0,createdAt:now,updatedAt:now}],tags:[]}));
const orders = [{id:'20260531226124',createdAt:'2026-05-31T16:46:00Z',status:'PENDING',totalPrice:'3000',user:{id:'u1',label:'phama9162@gmail.com',email:'phama9162@gmail.com',phone:null},payment:{method:'PAYOS',status:'PENDING',paidAt:null,transactionStatus:'PENDING',orderCode:'20260531226124',transactionPaidAt:null},items:[{id:'oi1',productId:products[0].id,variantId:'v1',name:products[0].name,imageUrl:img.pants,attributesText:'Số lượng: 1',quantity:1,price:'3000'}]}, {id:'20260527278135',createdAt:'2026-05-27T18:43:00Z',status:'CANCELLED',totalPrice:'2000',user:{id:'u2',label:'sonltute@gmail.com',email:'sonltute@gmail.com',phone:null},payment:{method:'PAYOS',status:'PENDING',paidAt:null,transactionStatus:'CANCELLED',orderCode:'20260527278135',transactionPaidAt:null},items:[{id:'oi2',productId:products[2].id,variantId:'v3',name:products[2].name,imageUrl:img.shirt,attributesText:'size: S • color: Trắng',quantity:1,price:'2000'}]}];
async function mockCustomer(route){
 const u = route.request().url(); const path = new URL(u).pathname;
 if(path.includes('/api/cart/summary')) return route.fulfill({json:api({totalItems:2,totalPrice:8000})});
 if(path.endsWith('/api/cart')) return route.fulfill({json:api(cart)});
 if(path.includes('/api/products/favorites')) return route.fulfill({json:api({products:[products[0],products[1]].map(p=>({productId:p.id,name:p.name,slug:p.slug,imageUrl:p.imageUrl,minPrice:p.minPrice,favoritedAt:now})),pagination:{page:1,limit:20,total:2,totalPages:1}})});
 if(path.includes('/api/orders/counts')) return route.fulfill({json:api({all:2,pending:0,processing:0,shipping:0,completed:1,canceled:1})});
 if(path.endsWith('/api/orders')) return route.fulfill({json:api({items:orders.map(o=>({...o,orderCode:o.id,items:o.items.map(it=>({productName:it.name,image:{url:it.imageUrl,altText:it.name},quantity:it.quantity,unitPrice:Number(it.price),variantAttributes:{size:'S',color:'Trắng'}}))})),pagination:{page:1,limit:10,total:2,totalPages:1}})});
 if(path.includes('/api/chatbot')) return route.fulfill({json:api({session:{id:'chat-demo',status:'ACTIVE',lastMessageAt:now},messages:[{id:'m1',role:'ASSISTANT',content:'Chọn đồ nhanh hơn\nGợi ý theo ngân sách, mục đích mặc và phong cách.',createdAt:now,suggestedProducts:products.slice(0,2).map(p=>({id:p.id,name:p.name,href:'/product/'+p.id,imageUrl:p.imageUrl,minPrice:p.minPrice})),quickReplies:[{label:'Đồ đi làm',value:'Đồ đi làm'},{label:'Đồ đi chơi',value:'Đồ đi chơi'},{label:'Ngân sách 500k',value:'Ngân sách 500k'}]}]})});
 if(path.includes('/api/recommendations')) return route.fulfill({json:api({items:products,products})});
 try { const resp = await route.fetch({ url: u.replace(/^http:\/\/(localhost|127\.0\.0\.1):8080/,'http://160.187.229.142:8080') }); return route.fulfill({ response: resp }); } catch(e) { return route.fulfill({json:api({})}); }
}
async function mockAdmin(route){
 const url = new URL(route.request().url()); const p=url.pathname;
 if(p.includes('/admin/dashboard/overview')) return route.fulfill({json:api({range:{from:'2026-05-03',to:'2026-06-01',days:30},revenue:{currency:'VND',total:0},orders:{total:0},itemsSold:{total:0},profit:{currency:'VND',total:0},updatedAt:now})});
 if(p.includes('/admin/dashboard/timeseries')) return route.fulfill({json:api({from:'2026-05-03',to:'2026-06-01',days:30,points:[0,0,1,0,0,6,1].map((n,i)=>({date:`2026-05-${20+i}`,revenue:n*1000,orders:n,itemsSold:n})),updatedAt:now})});
 if(p.includes('/admin/dashboard/recent-orders')) return route.fulfill({json:api({items:[{id:'1',orderCode:'#20260531226124',createdAt:now,status:'PENDING',totalPrice:3000,customerEmail:'phama9162@gmail.com',paymentMethod:'PAYOS',paymentStatus:'PENDING'}]})});
 if(p.includes('/admin/products')) return route.fulfill({json:api({items:adminProductItems,pagination:{page:1,limit:20,total:3,totalPages:1},aggregations:{statusCount:{active:3,inactive:0,deleted:0},stockStatus:{all:3,low:1,out:0}}})});
 if(p.includes('/admin/orders/counts')) return route.fulfill({json:api({all:11,pending:7,processing:0,shipped:0,completed:0,canceled:4})});
 if(p.includes('/admin/orders/status-breakdown')) return route.fulfill({json:api({from:'2026-05-03',to:'2026-06-01',days:30,total:11,counts:{PENDING:7,CANCELLED:4},updatedAt:now})});
 if(p.includes('/admin/orders/timeseries')) return route.fulfill({json:api({from:'2026-05-03',to:'2026-06-01',days:30,points:[0,0,1,0,0,6,1].map((n,i)=>({date:`2026-05-${20+i}`,total:n})),updatedAt:now})});
 if(p.includes('/admin/orders')) return route.fulfill({json:api({items:orders,pagination:{page:1,limit:20,total:2,totalPages:1}})});
 if(p.includes('/admin/users/customer-cohorts')) return route.fulfill({json:api({from:'2026-05-03',to:'2026-06-01',days:30,customersWithOrders:0,newCustomers:0,returningCustomers:0,updatedAt:now})});
 if(p.includes('/admin/users/top-spenders')) return route.fulfill({json:api({from:'2026-05-03',to:'2026-06-01',days:30,limit:5,items:[],updatedAt:now})});
 if(p.includes('/admin/users')) return route.fulfill({json:api({items:['phama9162@gmail.com','nguyenducsang9a@gmail.com','tuantran.it.net@gmail.com','tuan01687524688@gmail.co','letong29081980@gmail.com','22110407@student.hcmute.edu.vn'].map((email,i)=>({id:'u'+i,email,phone:null,status:i===3?'BANNED':'ACTIVE',emailVerified:i!==3,lastLogin:i===3?null:now,createdAt:now,updatedAt:now,role:'BUYER'})),pagination:{page:1,limit:20,total:12,totalPages:1},aggregations:{statusCount:{active:11,suspended:0,banned:1},roleCount:{admin:1,buyer:11}}})});
 if(p.includes('/admin/refunds')) return route.fulfill({json:api({items:[],pagination:{page:1,limit:20,total:0,totalPages:1},aggregations:{pending:0,success:0,failed:0,retrying:0}})});
 if(p.includes('/admin/logs')) return route.fulfill({json:api({items:orders.concat(orders).map((o,i)=>({id:'log'+i,createdAt:o.createdAt,actorType:'USER',actorLabel:o.user.email,action:i%2?'Thanh toán thất bại':'Người dùng tạo yêu cầu thanh toán',targetType:'Đơn hàng',targetId:o.id,metadata:{orderCode:o.id,payableAmount:o.totalPrice}})),pagination:{page:1,limit:20,total:14,totalPages:1}})});
 if(p.includes('/admin/vouchers')) return route.fulfill({json:api({items:[{id:'v1',code:'SALE-2604',type:'FIXED_AMOUNT',value:500,maxDiscountAmount:null,minOrderAmount:null,usageLimit:100,usedCount:1,perUserLimit:1,startsAt:'2026-04-26T13:23:50Z',endsAt:'2026-04-30T13:18:00Z',status:'expired',description:''},{id:'v2',code:'SALE-120',type:'PERCENTAGE',value:60,maxDiscountAmount:20000,minOrderAmount:100000,usageLimit:2,usedCount:0,perUserLimit:1,startsAt:'2026-04-18T14:49:16Z',endsAt:'2026-04-25T14:44:16Z',status:'expired',description:''}],pagination:{page:1,limit:20,total:2,totalPages:1}})});
 if(p.includes('/admin/banners')) return route.fulfill({json:api({items:[0,1,2].map(i=>({id:'b'+i,title:'Bộ sưu tập 2026',subtitle:'Streetwear Tối Giản Cho Mọi Khoảnh Khắc',description:'',imageUrl:i===1?'https://res.cloudinary.com/dcbrinjr6/image/upload/v1775228509/fashionboy_z4kk8z.png':img.shirt,linkUrl:'/',sortOrder:i,isActive:true,createdAt:now,updatedAt:now})),pagination:{page:1,limit:20,total:3,totalPages:1}})});
 return route.fulfill({json:api({items:[],pagination:{page:1,limit:20,total:0,totalPages:1}})});
}
async function prepareCustomer(page){
 await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/.*/, mockCustomer);
 await page.goto('http://127.0.0.1:3002', {waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{localStorage.setItem('access_token','demo');localStorage.setItem('refresh_token','demo');localStorage.setItem('auth-session',JSON.stringify({state:{user:{id:'u1',email:'22110407@student.hcmute.edu.vn',role:'BUYER',status:'ACTIVE'},profile:{fullName:'Lê Trường Sơn'},token:{accessToken:'demo',refreshToken:'demo'},isAuthenticated:true},version:0}));});
}
async function shot(page, url, name, opts={}){
 await page.goto(url, {waitUntil:'commit', timeout:120000});
 await page.waitForTimeout(opts.wait||6500);
 if(opts.action) await opts.action(page);
 await page.screenshot({path:`${outDir}/${name}.png`, fullPage:false});
 console.log(name);
}
(async()=>{
 const browser = await chromium.launch({headless:true});
 const cctx = await browser.newContext({viewport:{width:1900,height:940}, deviceScaleFactor:1});
 const cp = await cctx.newPage(); cp.on('pageerror', e=>console.log('cust err',e.message));
 await prepareCustomer(cp);
 const base='http://127.0.0.1:3002';
 await shot(cp, base+'/', '01_trang_chu', {wait:7000});
 await shot(cp, base+'/login', '02_dang_nhap');
 await shot(cp, base+'/forgot-password', '03_quen_mat_khau');
 await shot(cp, base+'/product/a30301a7-e795-4972-a317-9ce06db9780a', '04_chi_tiet_san_pham', {wait:7000});
 await shot(cp, base+'/cart', '05_gio_hang');
 await shot(cp, base+'/checkout/confirm?items=ci2', '06_thanh_toan');
 await shot(cp, base+'/collection/ao', '07_bo_suu_tap_ao', {wait:7000});
 await shot(cp, base+'/orders', '08_lich_su_don_hang');
 await shot(cp, base+'/favorites', '10_yeu_thich');
 await shot(cp, base+'/store', '11_cua_hang');
 await shot(cp, base+'/collection/ao', '12_tim_kiem', {action:async p=>{await p.locator('button').filter({hasText:''}).nth(2).click().catch(()=>{}); await p.keyboard.press('Control+K').catch(()=>{}); await p.waitForTimeout(500); await p.keyboard.type('Áo'); await p.waitForTimeout(1500);}});
 await shot(cp, base+'/orders', '09_chatbot_ai', {action:async p=>{await p.locator('button:has-text("Đồ đi làm")').click().catch(()=>{}); await p.locator('[aria-label*="chat"], button').last().click().catch(()=>{}); await p.waitForTimeout(2000);}});
 const actx = await browser.newContext({viewport:{width:1900,height:940}, deviceScaleFactor:1});
 await actx.addInitScript(()=>localStorage.setItem('auth-storage', JSON.stringify({state:{user:{id:'admin',email:'admin@aura.local',fullName:'Quản trị viên',roles:['ADMIN']},accessToken:'demo',refreshToken:'demo',isAuthenticated:true},version:0})));
 const ap = await actx.newPage(); ap.on('pageerror', e=>console.log('admin err',e.message)); await ap.route('**/api/**', mockAdmin);
 const abase='http://127.0.0.1:5176';
 for (const [url,name] of [['/dashboard','13_admin_tong_quan'],['/products','14_admin_san_pham'],['/orders','15_admin_don_hang'],['/users','16_admin_nguoi_dung'],['/refunds','17_admin_hoan_tien'],['/logs','18_admin_nhat_ky'],['/voucher','19_admin_ma_giam_gia'],['/banner','20_admin_bieu_ngu']]) await shot(ap, abase+url, name, {wait:3500});
 await browser.close();
})();
