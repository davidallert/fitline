create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_sv text not null,
  name_en text not null,
  description_sv text,
  description_en text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories public read" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  article_number text,
  name_sv text not null,
  name_en text not null,
  tagline_sv text,
  tagline_en text,
  description_sv text,
  description_en text,
  benefits_sv text,
  benefits_en text,
  price numeric(10,2),
  currency text not null default 'SEK',
  image_url text,
  gallery text[] not null default '{}',
  external_url text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Published products public read" on public.products for select to anon, authenticated
  using (is_published or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update products" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;
grant all on public.product_categories to service_role;
alter table public.product_categories enable row level security;
create policy "Product categories public read" on public.product_categories for select to anon, authenticated using (true);
create policy "Admins manage product categories" on public.product_categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  language text not null default 'sv',
  created_at timestamptz not null default now(),
  constraint email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 255)
);
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "Admins read subscribers" on public.newsletter_subscribers for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete subscribers" on public.newsletter_subscribers for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins read product images" on storage.objects for select to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

insert into public.categories (slug,name_sv,name_en,description_sv,description_en,sort_order) values
('optimalsupply','Optimal tillgång','Optimal Supply','Grunden för daglig energi och välmående.','The foundation for daily energy and wellbeing.',0),
('fitness','Träning','Fitness','Prestera, återhämta och bygg styrka.','Perform, recover and build strength.',1),
('specialneeds','Särskilda behov','Special Needs','Riktat stöd för dina specifika behov.','Targeted support for your specific needs.',2),
('beauty','Skönhet','Beauty','Hudvård och skönhet inifrån och utifrån.','Skin care and beauty from inside and out.',3),
('weightmanagement','Viktkontroll','Weight Management','Smarta verktyg för din viktresa.','Smart tools for your weight journey.',4);

insert into public.products (slug,article_number,name_sv,name_en,tagline_sv,tagline_en,description_sv,description_en,benefits_sv,benefits_en,price,image_url,is_featured,is_new,sort_order) values
('dark-spot-corrector','0116222','Dark Spot Corrector','Dark Spot Corrector','Avancerat elixir som riktar in sig på pigmentfläckar – för en jämn och strålande hudton.','Advanced elixir that targets pigmentation spots – for an even and radiant complexion.','Detta avancerade elixir kan bidra till att minska synligheten av pigmentfläckar och ojämn hudton.\nNoggrant utvalda ingredienser av hög kvalitet kan bidra till en ljusare och jämnare hudton och ett mer strålande utseende.','This advanced elixir can help to reduce the appearance of pigmentation spots and uneven skin tone.\nHigh-quality selected ingredients can support a brighter, more even complexion and a more radiant look.','Mot pigmentering\nFörnyelse av hudceller\nÅterfuktning\nStöd för hudbarriären\nLyster & klarhet','Anti-Pigmentation\nSkin Cell Renewal\nHydration\nBarrier Support\nRadiance & Clarity',730,'https://cdn.pm-international.com/products/c29d8838-43d8-4a99-9dca-fb09d88b51bd.png',false,true,2),
('optimal-set-powercocktail-restorate','9700731','Optimal-Set (PowerCocktail & Restorate)','Optimal-Set (PowerCocktail & Restorate Citrus)','Viktiga vitaminer och näringsrika mineraler – varje dag, för hela familjen.','Essential vitamins and nutritious minerals – every single day, for the whole family.','FitLine Optimal-Set kombinerar vår banbrytande NTC®-teknik i två produkter som en daglig rutin: FitLine PowerCocktail på morgonen och FitLine Restorate på kvällen.','The FitLine Optimal-Set combines our cutting-edge NTC® technology in two products to take as a daily routine: FitLine PowerCocktail in the morning and FitLine Restorate in the evening.','Energi\nKraft\nKoncentration\nImmunsystemet\nHår, naglar och hud\nRegeneration','Energy\nPower\nConcentration\nImmune system\nHair, nails & skin\nRegeneration',1330,'https://cdn.pm-international.com/products/244ccde8-4dee-469f-9f46-595f7b6b429a.png',true,false,6),
('powercocktail','0705067','PowerCocktail','PowerCocktail','Din dagliga morgonrutin för den optimala dosen näringsämnen som kickstartar dagen.','Your daily morning routine for the optimal dose of nutrients to kick-start your day.','Den unika kombinationen i FitLine PowerCocktail innehåller naturliga extrakt från bär, frukt, grönsaker, örter och kryddor – polyfenoler och vitaminer för ett 2-i-1-stöd för energi, koncentration och immunsystemet.','The unique combination of FitLine PowerCocktail contains natural extracts from berries, fruits, vegetables, herbs and spices – polyphenols and vitamins for 2-in-1 support for energy, concentration and the immune system.','Energi\nKraft\nKoncentration\nImmunsystemet','Energy\nPower\nConcentration\nImmune system',1100,'https://cdn.pm-international.com/products/1523cde4-7205-4634-8be2-dfe7f84214f9.png',true,false,10),
('activize-oxyplus','0708054','Activize Oxyplus','Activize Oxyplus','Gör dig redo för din nästa energinivå och håll fokus för produktiva dagar.','Get ready for your next energy level and stay focused for productive days ahead.','FitLine Activize är tillbaka med en ny patenterad formula tack vare globalt vetenskapligt samarbete. Formeln stödjer näringsämnenas biotillgänglighet genom vår exklusiva NTC®.','FitLine Activize is made with a patented formula thanks to global scientific collaboration. The formula supports the absorption of nutrients through our exclusive NTC®.','Energi\nKraft\nKoncentration','Energy\nPower\nConcentration',370,'https://cdn.pm-international.com/products/a1eed226-61ac-448b-8318-40134aef249f.png',true,false,11),
('restorate-citrus','0702037','Restorate Citrus','Restorate Citrus','Dina kvällsmineraler för en rogivande natt.','Your evening minerals for a restful night.','Restorate är den perfekta "god natt"-drycken med högkvalitativt kalcium, magnesium, selen, koppar, mangan, krom och D-vitamin. Smak av apelsin-citron.','Restorate is the ideal "good night" drink with high-quality calcium, magnesium, selenium, copper, manganese, chromium and vitamin D. Orange-lemon flavour.','Hår, naglar & hud\nSkelett\nTänder\nRegeneration','Hair, nails & skin\nBones\nTeeth\nRegeneration',290,'https://cdn.pm-international.com/products/4225ca9e-2396-463b-86bc-934d521f32a5.png',true,false,14),
('basics','0705066','Basics','Basics','Din dagliga optimala försörjning för att skydda dina celler och ditt immunsystem.','Your daily drink to protect your cells and your immune system.','FitLine Basics är din dagliga optimala försörjning för att skydda dina celler och ditt immunsystem. Få i dig alla vitaminer du behöver för att kickstarta dagen. Smak av apelsin.','FitLine Basics is your daily optimal supply to protect your cells and your immune system. Get the full amount of vitamins to kickstart your day. Flavour: orange.','Skydda dina celler\nImmunsystemet','Protect your cells\nImmune system',710,'https://cdn.pm-international.com/products/fa2e7a09-052a-42b4-999e-74da6b590135.png',true,false,17),
('munogen','0704026','Munogen','Munogen','Stödjer din blodcellsbildning med en holistisk kombination av vitaminer och naturliga ingredienser.','Supports your blood cell formation with a holistic combination of vitamins and natural ingredients.','FitLine Munogen är en exklusiv allt-i-ett-kombination med bioaktiva ingredienser, sekundära växtämnen, aminosyror och vitaminer som bidrar till normal blodbildning och minskad trötthet.','FitLine Munogen is an exclusive all-in-one combination with bioactive ingredients, secondary plant substances, amino acids and vitamins that contribute to normal blood formation and reduced tiredness.','Stödjer blodcellsbildningen\nMinskad trötthet','Supports blood cell formation\nReduction of tiredness',650,'https://cdn.pm-international.com/products/e5a7c5bb-4eaa-441a-896f-116892243026.png',true,false,18),
('antioxy','0707013','Antioxy','Antioxy','Din dagliga dryck för att ta hand om ditt immunsystem.','Your daily drink to take care of your immune system.','FitLine Antioxy finns nu med en förbättrad formula, berikad med specialextrakt och koncentrat från bär, frukt, grönsaker, örter och kryddor.','FitLine Antioxy is now available with an improved formula, enriched with special extracts and concentrates of berries, fruits, vegetables, herbs and spices.','Immunsystemet\nSkydd mot oxidativ stress','Immune system\nProtection from oxidative stress',480,'https://cdn.pm-international.com/products/96af4489-f2f0-44bc-8313-4a03b05e32fd.png',false,false,19),
('beauty','0709028','Beauty','Beauty','Fruktig bärsmak med vitaminer och mineraler för hud, hår och naglar.','A fruity berry taste with vitamins and minerals for skin, hair and nails.','FitLine Beauty är ditt avgörande beauty-plus: en läcker, fruktig bärsmak med vitaminer och mineraler som stödjer din hud, ditt hår och dina naglar.','FitLine Beauty is your decisive beauty-plus: a delicious, fruity berry flavour with vitamins and minerals to support your skin, hair and nails.','Strålande hud\nVackert hår\nNaglar','Radiant skin\nBeautiful hair\nNails',560,'https://cdn.pm-international.com/products/f2de3b29-ed5e-432b-aff9-15b5c4eeac55.png',false,false,20),
('d-drink','0702083','D-Drink','D-Drink','Ge din kropp en nystart med vårt 14-dagarsprogram.','Give your body a fresh start with our 14-day program.','Njut av FitLine D-Drink med läcker äppelsmak och behaglig konsistens för att få ut det mesta av ditt 14-dagars rengöringsprogram.','Enjoy FitLine D-Drink with a delicious apple taste and a pleasant texture to make the most of your 14-day cleansing program.','Stödjer leverfunktionen\nStödjer ämnesomsättningen','Supports liver function\nSupports metabolism',380,'https://cdn.pm-international.com/products/4a6466fa-5a3d-4624-b1a3-5069091529c1.png',false,false,24),
('women','0709062','Women+','Women+','Livets nästa kapitel. Stödjer hormonell aktivitet så att du känner dig trygg och i balans.','The next chapter of life. Supports hormonal activity so you feel confident and balanced.','Varje kvinnas resa är fylld av förändring och styrka. När din kropp utvecklas förtjänar den balans, energi och omtanke – det är där FitLine Women+ kommer in.','Every woman’s journey is filled with change and strength. As your body evolves, it deserves balance, energy and care – that’s where FitLine Women+ comes in.','Hormonell balans\nKoncentration\nMinskar trötthet','Hormonal balance\nConcentration\nReduction of tiredness',580,'https://cdn.pm-international.com/products/2f5e2195-234e-41ca-aeb2-61814976a122.png',false,false,26),
('topshape','0704031','TopShape¹','TopShape','Designad för din vardag – den perfekta följeslagaren för att nå dina mål.','Designed for your everyday routine – the perfect companion to support your goals.','Upptäck kraften i en vetenskaplig revolution: en banbrytande formula utvecklad genom globalt samarbete och det exklusiva NTC® för optimala resultat.','Discover the power of a scientific revolution: a cutting-edge formula developed through global collaboration and the exclusive NTC® for optimum results.','Ämnesomsättning\nKom i toppform','Support metabolism\nGet in top shape',1050,'https://cdn.pm-international.com/products/7c2cfad6-64c9-4ef7-9d82-1f2bef44a184.png',true,false,27),
('proshape-all-in-1-chocolate','0701045','ProShape All-in-1 Chocolate','ProShape All-in-1 Chocolate Vegan','Komplett växtbaserad proteinmåltid – en bekväm lösning för att komma i form.','Complete plant-based protein meal – a convenient get-in-shape solution.','Vegansk och laktosfri formula som passar olika kostvanor. FitLine ProShape All-in-1 är den ideala måltidsersättningen medan du kommer i form.','Vegan and lactose-free formula that fits different nutrition habits. FitLine ProShape All-in-1 is the ideal meal replacement while you get in shape.','Kom i form\nBehåll formen','Get in shape\nStay in shape',440,'https://cdn.pm-international.com/products/a8b92b26-61d8-49d3-a2ff-6a8277a603ad.png',false,false,37),
('ultimate-young','0116050','Ultimate Young','Ultimate Young','Nyckeln till omedelbara resultat och en perfekt hud.','The key to immediate results and perfect skin.','Vårt 3-minuterslyft: ett 2-fasigt elixir i en flaska för omedelbara resultat, med hudtonsanpassare som matchar din individuella hudton.','Our 3-minute lifting: a 2-phase elixir in one bottle for immediate results, with a skin tone matcher that adapts to your individual skin tone.','Slät och jämn hud\nEnkel att använda','Smooth & even skin\nEasy to use',990,'https://cdn.pm-international.com/products/c8592376-2ba1-402c-a1d6-908c1ae54ef4.png',true,false,44);

update public.products set
  description_sv = replace(description_sv, '\n', chr(10)),
  description_en = replace(description_en, '\n', chr(10)),
  benefits_sv = replace(benefits_sv, '\n', chr(10)),
  benefits_en = replace(benefits_en, '\n', chr(10));

insert into public.product_categories (product_id, category_id)
select p.id, c.id from (values ('dark-spot-corrector','beauty'),('optimal-set-powercocktail-restorate','optimalsupply'),('powercocktail','optimalsupply'),('activize-oxyplus','optimalsupply'),('activize-oxyplus','fitness'),('activize-oxyplus','specialneeds'),('restorate-citrus','optimalsupply'),('basics','optimalsupply'),('munogen','fitness'),('munogen','specialneeds'),('antioxy','specialneeds'),('beauty','beauty'),('d-drink','specialneeds'),('women','specialneeds'),('topshape','weightmanagement'),('proshape-all-in-1-chocolate','weightmanagement'),('ultimate-young','beauty'),('powercocktail','fitness')) v(ps, cs)
join public.products p on p.slug = v.ps join public.categories c on c.slug = v.cs;