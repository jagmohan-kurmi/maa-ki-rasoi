import { useEffect, useState } from 'react';
import {
  Phone, MessageCircle, MapPin, Clock, Utensils, Heart, Shield, Wallet,
  Users, Star, ChevronDown, Menu, X, LogIn, CheckCircle2, ChefHat,
  Calendar, Leaf, Drumstick, Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import type { Plan, Settings, WeeklyMenu } from '@/types';
import { CustomerLoginModal } from '@/components/public/CustomerLoginModal';

const DEFAULT_SETTINGS: Settings = {
  id: '', business_name: 'Maa Ki Rasoi', tagline: 'घर जैसा खाना, घर जैसा प्यार',
  phone: '9826567890', whatsapp: '9826567890', email: 'maakirasoiankit65679@gmail.com',
  address: 'Gopalganj, Sagar (Madhya Pradesh)',
  google_map_url: 'https://maps.google.com/?q=Gopalganj+Sagar+Madhya+Pradesh',
  business_timing: 'सुबह 6:00 बजे से रात 10:00 बजे तक',
  monthly_delivery_charge: 300, receipt_footer: '', currency: '₹',
  admin_email: '', logo_url: '', updated_at: '',
};

const HERO_IMG = 'https://images.pexels.com/photos/35008222/pexels-photo-35008222.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const ABOUT_IMG = 'https://images.pexels.com/photos/37330104/pexels-photo-37330104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const GALLERY_IMGS = [
  'https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7351635/pexels-photo-7351635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/37420999/pexels-photo-37420999.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8818657/pexels-photo-8818657.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6363501/pexels-photo-6363501.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/32825914/pexels-photo-32825914.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const WHY_CHOOSE = [
  { icon: Heart, title: 'घर जैसा स्वाद', desc: 'माँ के हाथों जैसा ताज़ा और स्वादिष्ट खाना, रोज़ बनाया गया।' },
  { icon: Wallet, title: 'किफ़ायती दाम', desc: 'छात्रों और कामकाजी लोगों के लिए बजट में बने रहने वाली योजनाएँ।' },
  { icon: Shield, title: 'स्वच्छ रसोई', desc: 'साफ-सफाई और स्वच्छता हमारी सबसे बड़ी प्राथमिकता है।' },
  { icon: Utensils, title: 'रोज़ नया मेनू', desc: 'हर हफ़्ते नया साप्ताहिक मेनू - विविधता और पौष्टिकता के साथ।' },
  { icon: Users, title: 'छात्रों के लिए विशेष', desc: 'कॉलेज के पास स्थित, छात्रों के लिए विशेष छूट उपलब्ध।' },
  { icon: Clock, title: 'समय पर डिलीवरी', desc: 'नाश्ता, लंच और डिनर - सही समय पर, हर दिन।' },
];

const FAQS = [
  { q: 'माा की रसोई कहाँ स्थित है?', a: 'हम गोपालगंज, सागर (मध्य प्रदेश) में स्थित हैं। कॉलेज और छात्र क्षेत्र के पास हमारी सुविधा आसानी से उपलब्ध है।' },
  { q: 'क्या मैं रोज़ तीन वक़्त का खाना पा सकता हूँ?', a: 'जी हाँ! हम ब्रेकफ़ास्ट, लंच और डिनर - तीनों वक़्त का ताज़ा भोजन प्रदान करते हैं। आप अपनी पसंद की योजना चुन सकते हैं।' },
  { q: 'क्या नॉन-वेज उपलब्ध है?', a: 'जी हाँ, हम शाकाहारी और मांसाहारी दोनों योजनाएँ प्रदान करते हैं। नॉन-वेज योजना में सप्ताह में 3 दिन नॉन-वेज मिलता है।' },
  { q: 'सदस्यता कैसे लें?', a: 'सदस्यता के लिए सीधे हमसे संपर्क करें। हम आपका एक अकाउंट बनाएँगे और लॉगिन क्रेडेंशियल देंगे, जिससे आप ऑनलाइन अपनी जानकारी देख सकते हैं।' },
  { q: 'क्या टिफ़िन डिलीवरी उपलब्ध है?', a: 'जी हाँ, हम आपके घर/कमरे तक डिलीवरी करते हैं। मासिक डिलीवरी शुल्क लागू होता है, जो आपकी योजना में शामिल है।' },
  { q: 'अगर मैं कुछ दिन नहीं खाऊँ तो क्या होगा?', a: 'आप अपनी सदस्यता अस्थायी रूप से रोक (pause) सकते हैं। वापस आने पर आपकी योजना फिर से सक्रिय हो जाएगी।' },
];

const TESTIMONIALS = [
  { name: 'राहुल वर्मा', role: 'छात्र, सागर कॉलेज', text: 'माा की रसोई ने मेरी हॉस्टल लाइफ बदल दी। घर जैसा खाना मिलता है और दाम भी बजट में। रोज़ ताज़ा और स्वादिष्ट!', rating: 5 },
  { name: 'प्रिया शर्मा', role: 'कार्यकारी, सागर', text: 'ऑफ़िस के काम के कारण खाना बनाने का समय नहीं मिलता था। माा की रसोई से डिलीवरी पाती हूँ - समय पर और गरमा-गरम।', rating: 5 },
  { name: 'अमित यादव', role: 'छात्र, इंजीनियरिंग कॉलेज', text: 'साप्ताहिक मेनू बदलता रहता है इसलिए ऊब नहीं लगती। नॉन-वेज भी मिलता है - बढ़िया व्यवस्था!', rating: 5 },
  { name: 'नीलम सिंह', role: 'बी.कॉम छात्र', text: 'स्वच्छता बहुत अच्छी है और बहन जी बहुत प्यार से खाना बनाती हैं। घर से दूर रहने पर यह बहुत राहत देता है।', rating: 5 },
];

export function HomePage() {
  const { settings } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [menu, setMenu] = useState<WeeklyMenu[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const s = settings || DEFAULT_SETTINGS;

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('weekly_menu').select('*').order('sort_order'),
      ]);
      if (p) setPlans(p as Plan[]);
      if (m) setMenu(m as WeeklyMenu[]);
    })();
  }, []);

  const navLinks = [
    { label: 'होम', href: '#home' },
    { label: 'हमारे बारे में', href: '#about' },
    { label: 'योजनाएँ', href: '#plans' },
    { label: 'मेनू', href: '#menu' },
    { label: 'गैलरी', href: '#gallery' },
    { label: 'समीक्षाएँ', href: '#testimonials' },
    { label: 'प्रश्न', href: '#faqs' },
    { label: 'संपर्क', href: '#contact' },
  ];

  const scrollTo = (href: string) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const waLink = `https://wa.me/91${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('नमस्ते! माा की रसोई के बारे में जानकारी चाहिए।')}`;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-maroon-700 flex items-center justify-center text-white">
                <Utensils size={20} />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-maroon-800 leading-none">Maa Ki Rasoi</h1>
                <p className="text-xs text-maroon-500">गोपालगंज, सागर</p>
              </div>
            </a>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="px-3 py-2 text-sm font-medium text-maroon-700 hover:text-maroon-900 hover:bg-maroon-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => setLoginOpen(true)} className="btn-primary text-sm py-2">
                <LogIn size={16} /> लॉगिन
              </button>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 rounded-lg hover:bg-maroon-50 text-maroon-700">
                {mobileMenu ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {mobileMenu && (
            <nav className="lg:hidden pb-4 flex flex-col gap-1 animate-fade-in">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="px-4 py-2.5 text-left text-sm font-medium text-maroon-700 hover:bg-maroon-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="स्वादिष्ट भारतीय थाली" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-br from-maroon-950/90 via-maroon-900/80 to-maroon-800/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream-100/20 backdrop-blur-sm border border-cream-200/30 text-cream-100 text-sm font-medium mb-6">
              <Sparkles size={14} /> सागर का सबसे भरोसेमंद मेस
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              घर जैसा खाना,<br />घर जैसा प्यार
            </h2>
            <p className="text-lg text-cream-100 mb-8 max-w-xl">
              गोपालगंज, सागर में छात्रों और कामकाजी लोगों के लिए किफ़ायती मासिक मेस और टिफ़िन सेवा। रोज़ ताज़ा, स्वादिष्ट और स्वच्छ भोजन।
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollTo('#plans')} className="btn-primary bg-cream-400 text-maroon-900 hover:bg-cream-300">
                योजनाएँ देखें
              </button>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn bg-green-600 text-white hover:bg-green-700">
                <MessageCircle size={18} /> WhatsApp करें
              </a>
              <a href={`tel:${s.phone}`} className="btn-outline bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Phone size={18} /> कॉल करें
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 sm:py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">हमारे बारे में</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2 mb-6">
                माा की रसोई - परिवार जैसा प्यार
              </h2>
              <p className="text-maroon-700 leading-relaxed mb-4">
                <strong>माा की रसोई</strong> गोपालगंज, सागर (मध्य प्रदेश) में स्थित एक परिवार द्वारा चलाया जाने वाला मेस है। हम छात्रों, कामकाजी लोगों और उन सभी के लिए घर जैसा ताज़ा और स्वादिष्ट भोजन उपलब्ध कराते हैं जो घर से दूर रहकर भी स्वस्थ खाना चाहते हैं।
              </p>
              <p className="text-maroon-700 leading-relaxed mb-6">
                हमारी रसोई में ताज़ी सामग्री, स्वच्छता और घर का स्वाद सबसे ऊपर है। हर दिन नया मेनू, शाकाहारी और मांसाहारी विकल्प, और समय पर डिलीवरी - सब कुछ आपकी सुविधा के लिए।
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-display text-3xl font-bold text-maroon-700">500+</p>
                  <p className="text-sm text-maroon-500">संतुष्ट ग्राहक</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-bold text-maroon-700">7</p>
                  <p className="text-sm text-maroon-500">दिन मेनू</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-bold text-maroon-700">3</p>
                  <p className="text-sm text-maroon-500">वक़्त खाना</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src={ABOUT_IMG} alt="भारतीय रसोई में ताज़ा सामग्री से खाना बनाते हुए" className="rounded-2xl shadow-xl w-full h-[400px] object-cover" loading="lazy" />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-6 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-maroon-100 flex items-center justify-center text-maroon-700">
                    <ChefHat size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-maroon-800">घर का बना</p>
                    <p className="text-sm text-maroon-500">ताज़ा और स्वादिष्ट</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">क्यों चुनें हमें</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">हमारी खूबियाँ</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item, i) => (
              <div key={i} className="card-hover p-6">
                <div className="w-12 h-12 rounded-xl bg-maroon-100 flex items-center justify-center text-maroon-700 mb-4">
                  <item.icon size={24} />
                </div>
                <h3 className="font-bold text-lg text-maroon-800 mb-2">{item.title}</h3>
                <p className="text-maroon-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-16 sm:py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">सदस्यता योजनाएँ</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">अपनी पसंद की योजना चुनें</h2>
            <p className="text-maroon-600 mt-3 max-w-2xl mx-auto">किफ़ायती दाम, घर जैसा स्वाद - छात्रों और कामकाजी लोगों के लिए विशेष योजनाएँ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full text-center text-maroon-500 py-8">योजनाएँ लोड हो रही हैं...</div>
            ) : plans.map((plan, i) => {
              const total = plan.monthly_subscription_charge + plan.monthly_delivery_charge;
              const isPopular = i === 0;
              return (
                <div key={plan.id} className={`card-hover p-6 relative flex flex-col ${isPopular ? 'ring-2 ring-maroon-600' : ''}`}>
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-maroon-700 text-white text-xs font-semibold">
                      लोकप्रिय
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {plan.veg && <Leaf size={18} className="text-green-600" />}
                    {plan.non_veg && <Drumstick size={18} className="text-maroon-600" />}
                    {plan.is_student_plan && <Star size={18} className="text-cream-500" />}
                  </div>
                  <h3 className="font-bold text-lg text-maroon-800 mb-1">{plan.name}</h3>
                  <p className="text-sm text-maroon-500 mb-4">{plan.duration}</p>
                  <div className="mb-4">
                    <span className="font-display text-3xl font-bold text-maroon-700">{formatCurrency(total, s.currency)}</span>
                    <span className="text-maroon-500 text-sm">/माह</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {plan.breakfast && <span className="badge-maroon">ब्रेकफ़ास्ट</span>}
                    {plan.lunch && <span className="badge-maroon">लंच</span>}
                    {plan.dinner && <span className="badge-maroon">डिनर</span>}
                  </div>
                  <p className="text-sm text-maroon-600 mb-4 flex-grow">{plan.description}</p>
                  <div className="text-sm text-maroon-600 whitespace-pre-line mb-4">
                    {plan.benefits?.split('\n').map((b, j) => b.trim() && (
                      <div key={j} className="flex items-start gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{b.trim()}</span>
                      </div>
                    ))}
                  </div>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-auto">
                    सदस्यता लें
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weekly Menu Preview */}
      <section id="menu" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">साप्ताहिक मेनू</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">हफ़्ते का मेनू</h2>
            <p className="text-maroon-600 mt-3">हर दिन कुछ नया - ताज़ा और स्वादिष्ट</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {menu.length === 0 ? (
              <div className="col-span-full text-center text-maroon-500 py-8">मेनू लोड हो रहा है...</div>
            ) : menu.map(day => (
              <div key={day.id} className="card p-5">
                <h3 className="font-bold text-maroon-800 mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-maroon-600" />
                  {day.day_of_week}
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-cream-700 uppercase">ब्रेकफ़ास्ट</p>
                    <p className="text-maroon-700">{day.breakfast || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cream-700 uppercase">लंच</p>
                    <p className="text-maroon-700">{day.lunch || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cream-700 uppercase">डिनर</p>
                    <p className="text-maroon-700">{day.dinner || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-16 sm:py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">गैलरी</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">हमारे व्यंजन</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {GALLERY_IMGS.map((src, i) => (
              <div key={i} className="overflow-hidden rounded-2xl aspect-square group">
                <img
                  src={src}
                  alt={`माा की रसोई व्यंजन ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">समीक्षाएँ</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">हमारे ग्राहक क्या कहते हैं</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-cream-500 fill-cream-500" />
                  ))}
                </div>
                <p className="text-maroon-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-cream-100">
                  <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-maroon-800 text-sm">{t.name}</p>
                    <p className="text-xs text-maroon-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-16 sm:py-24 bg-cream-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">प्रश्न</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">अक्सर पूछे जाने वाले प्रश्न</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-maroon-800">{faq.q}</span>
                  <ChevronDown size={20} className={`text-maroon-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-maroon-600 text-sm leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-maroon-600 font-semibold text-sm uppercase tracking-wide">संपर्क</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-maroon-800 mt-2">संपर्क करें</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-maroon-100 flex items-center justify-center text-maroon-700 flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-800">पता</h3>
                  <p className="text-maroon-600 text-sm">{s.address}</p>
                </div>
              </div>
              <div className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-maroon-100 flex items-center justify-center text-maroon-700 flex-shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-800">फ़ोन</h3>
                  <a href={`tel:${s.phone}`} className="text-maroon-600 text-sm hover:text-maroon-800">{s.phone}</a>
                </div>
              </div>
              <div className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-800">WhatsApp</h3>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-maroon-600 text-sm hover:text-maroon-800">{s.whatsapp}</a>
                </div>
              </div>
              <div className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-maroon-100 flex items-center justify-center text-maroon-700 flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-maroon-800">समय</h3>
                  <p className="text-maroon-600 text-sm">{s.business_timing}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-cream-200 min-h-[400px]">
              <iframe
                title="माा की रसोई स्थान"
                src="https://www.google.com/maps?q=Gopalganj+Sagar+Madhya+Pradesh&output=embed"
                className="w-full h-full min-h-[400px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-maroon-900 text-cream-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cream-400 flex items-center justify-center text-maroon-900">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Maa Ki Rasoi</h3>
                  <p className="text-xs text-cream-300">गोपालगंज, सागर</p>
                </div>
              </div>
              <p className="text-sm text-cream-300">{s.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">त्वरित लिंक</h4>
              <ul className="space-y-2 text-sm text-cream-300">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <button onClick={() => scrollTo(link.href)} className="hover:text-white transition-colors">{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">संपर्क</h4>
              <ul className="space-y-2 text-sm text-cream-300">
                <li className="flex items-center gap-2"><Phone size={14} /> {s.phone}</li>
                <li className="flex items-center gap-2"><MessageCircle size={14} /> {s.whatsapp}</li>
                <li className="flex items-center gap-2"><MapPin size={14} /> {s.address}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">समय</h4>
              <p className="text-sm text-cream-300">{s.business_timing}</p>
              <button onClick={() => setLoginOpen(true)} className="btn bg-cream-400 text-maroon-900 hover:bg-cream-300 mt-4 text-sm">
                <LogIn size={16} /> ग्राहक लॉगिन
              </button>
            </div>
          </div>
          <div className="pt-8 border-t border-maroon-800 text-center text-sm text-cream-400">
            <p>© {new Date().getFullYear()} माा की रसोई। सर्वाधिकार सुरक्षित। गोपालगंज, सागर (मध्य प्रदेश)</p>
          </div>
        </div>
      </footer>

      {/* Sticky Buttons */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          aria-label="WhatsApp पर संपर्क करें">
          <MessageCircle size={26} />
        </a>
        <a href={`tel:${s.phone}`}
          className="w-14 h-14 rounded-full bg-maroon-700 hover:bg-maroon-800 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          aria-label="कॉल करें">
          <Phone size={26} />
        </a>
      </div>

      <CustomerLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
