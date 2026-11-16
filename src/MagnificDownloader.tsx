import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { LuxuryGoldBackdrop } from './LuxuryGoldBackdrop';
import { DomationLogoMark } from './components/DomationLogoMark';
import { DECOR_PNGS } from './data/enterpriseData';
import { handleSpaLinkClick } from './utils/navigation';
import { usePageSeo } from './utils/seo';

export const MagnificDownloader = () => {
  usePageSeo({
    title: 'Magnific & Asset Preview Tool | DOMATION.NET',
    description: 'Công cụ hỗ trợ xem trước và trích xuất ảnh tài nguyên phục vụ đội ngũ thiết kế nội bộ DOMATION.',
    path: '/?page=magnific-downloader',
    noindex: true,
  });
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<{ originalUrl: string; imageUrl: string } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const isValidUrl = (testUrl: string) => {
    return testUrl.includes('magnific.com') || testUrl.includes('freepik.com') || testUrl.includes('stock.adobe.com');
  };

  const extractImageFromUrl = async (inputUrl: string) => {
    setIsLoading(true);
    setError(null);
    setImageResult(null);

    try {
      if (!isValidUrl(inputUrl)) {
        throw new Error('Vui lòng nhập link hợp lệ từ Magnific, Freepik hoặc Adobe Stock');
      }

      if (inputUrl.includes('magnific.com') || inputUrl.includes('freepik.com')) {
        try {
          const proxyBase = 'https://open.domation.net/proxy/magnific_proxy.php';
          const type = 15;

          const previewRes = await fetch(`${proxyBase}?action=imagePreview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `str=${encodeURIComponent(inputUrl)}&type=${type}`,
          });

          if (previewRes.ok) {
            const previewData = await previewRes.json();

            if (previewData.ok === 1 && previewData.objects && previewData.objects[0] && previewData.objects[0].pic) {
              setImageResult({
                originalUrl: inputUrl,
                imageUrl: `https://fotoget.org${previewData.objects[0].pic}`,
              });
              setIsLoading(false);
              return;
            }

            if (previewData && previewData.try_parsing_id) {
              for (let i = 0; i < 4; i++) {
                await new Promise((resolve) => setTimeout(resolve, 2500));
                const checkRes = await fetch(`${proxyBase}?action=checkTryParsing`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: `str=${encodeURIComponent(inputUrl)}&type=${type}&try_parsing_id=${previewData.try_parsing_id}`,
                });

                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.ok === 1 && checkData.objects && checkData.objects[0]) {
                    const pic = checkData.objects[0].pic;
                    if (pic) {
                      setImageResult({
                        originalUrl: inputUrl,
                        imageUrl: `https://fotoget.org${pic}`,
                      });
                      setIsLoading(false);
                      return;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Fotoget bypass failed, falling back to HTML parsing...', e);
        }
      }

      const proxyUrl = `https://open.domation.net/proxy/magnific_proxy.php?url=${encodeURIComponent(inputUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Không thể kết nối đến máy chủ proxy.');
      }

      let html = '';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }

      if (!html) {
        throw new Error('Không thể tải nội dung trang.');
      }

      if (
        html.includes('captcha-delivery.com') ||
        html.includes('Cloudflare') ||
        html.includes('Please enable JS and disable any ad blocker')
      ) {
        throw new Error('PROXY_BLOCKED');
      }

      const ogImageMatch =
        html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);

      const freepikCdnMatches = html.match(
        /https:\/\/(img\.)?(magnific\.com|freepik\.com)\/(free-photo|premium-psd|free-vector|premium-photo)[^"'\s]+\.(jpg|jpeg|png|webp)/gi
      );
      const adobeCdnMatches =
        html.match(/https:\/\/(as[12]\.ftcdn\.net|t[34]\.ftcdn\.net)\/v2\/jpg\/[^"'\s]+\.(jpg|jpeg)/gi) ||
        html.match(/https:\/\/(as[12]\.ftcdn\.net|t[34]\.ftcdn\.net)\/jpg\/[^"'\s]+\.(jpg|jpeg)/gi);

      let extractedImageUrl = '';

      if (freepikCdnMatches && freepikCdnMatches.length > 0) {
        const baseLink = freepikCdnMatches[0].split('?')[0];
        extractedImageUrl = baseLink + '?w=2000&t=st=' + Date.now();
      } else if (adobeCdnMatches && adobeCdnMatches.length > 0) {
        extractedImageUrl = adobeCdnMatches[0].split('?')[0];
      } else if (ogImageMatch && ogImageMatch[1]) {
        const baseLink = ogImageMatch[1].split('?')[0];
        if (baseLink.includes('freepik.com') || baseLink.includes('magnific.com')) {
          extractedImageUrl = baseLink + '?w=2000&t=st=' + Date.now();
        } else {
          extractedImageUrl = baseLink;
        }
      }

      if (!extractedImageUrl) {
        throw new Error('Không tìm thấy ảnh từ link này. Có thể cấu trúc trang đã thay đổi.');
      }

      if (inputUrl.includes('magnific.com') && extractedImageUrl.includes('freepik.com')) {
        extractedImageUrl = extractedImageUrl.replace('freepik.com', 'magnific.com');
      }

      setImageResult({
        originalUrl: inputUrl,
        imageUrl: extractedImageUrl,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích link.';

      if (errorMessage === 'PROXY_BLOCKED' || errorMessage.includes('fetch') || errorMessage.includes('kết nối proxy')) {
        setError(
          'Hệ thống Proxy của bạn đã bị tường lửa (Cloudflare/DataDome) chặn (Lỗi 403). Cần sử dụng ScraperAPI hoặc Session Cookies để vượt qua bức tường bảo mật của trang gốc.'
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.startsWith('http')) {
      setUrl(pastedText);
      if (isValidUrl(pastedText)) {
        extractImageFromUrl(pastedText);
      } else {
        setError('Vui lòng nhập link hợp lệ từ Magnific, Freepik hoặc Adobe Stock');
        setImageResult(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      if (isValidUrl(url)) {
        extractImageFromUrl(url);
      } else {
        setError('Vui lòng nhập link hợp lệ từ Magnific, Freepik hoặc Adobe Stock');
        setImageResult(null);
      }
    }
  };

  const downloadImage = (imageUrl: string) => {
    const proxyDownloadUrl = `https://open.domation.net/proxy/magnific_proxy.php?action=downloadImage&imgUrl=${encodeURIComponent(
      imageUrl
    )}`;
    const a = document.createElement('a');
    a.href = proxyDownloadUrl;
    a.download = 'premium_download.jpg';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-[#1E40FF] selection:text-white flex flex-col relative overflow-x-clip">
      <LuxuryGoldBackdrop />

      {/* Floating 3D PNG Decors */}
      <motion.img
        src={DECOR_PNGS.prism}
        alt=""
        aria-hidden="true"
        animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden xl:block pointer-events-none select-none fixed top-32 left-[3%] w-28 h-28 object-contain opacity-65 z-0"
      />
      <motion.img
        src={DECOR_PNGS.torus}
        alt=""
        aria-hidden="true"
        animate={{ y: [0, 14, 0], rotate: [5, -5, 5] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden xl:block pointer-events-none select-none fixed top-44 right-[3%] w-28 h-28 object-contain opacity-65 z-0"
      />

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 lg:py-20 relative z-10 flex flex-col">
        <div className="mb-8 flex justify-start">
          <a
            href="/"
            onClick={(e) => handleSpaLinkClick(e, '/')}
            className="ql-btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về DOMATION.NET
          </a>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div className="ql-eyebrow">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
              Premium Asset Tool
            </div>
            <div className="flex items-center gap-3">
              <DomationLogoMark size={44} />
              <span className="text-2xl font-black tracking-tight text-slate-900">
                DOMATION<span className="text-[#1E40FF]">.NET</span>
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight text-gradient-inkica">
            MAGNIFIC DOWNLOADER
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Dán đường link ảnh từ Magnific, Freepik hoặc Adobe Stock vào ô bên dưới để tự động trích xuất link ảnh gốc HD.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="w-full max-w-3xl mx-auto mb-12"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative flex items-center w-full bg-white/95 border border-slate-200/90 rounded-2xl p-2 shadow-[0_20px_50px_-15px_rgba(30,64,255,0.16)] backdrop-blur-xl transition-all focus-within:border-[#1E40FF]">
              <div className="pl-4 pr-2 text-slate-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://magnific.com/..."
                className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-2 text-base md:text-lg font-medium"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!url || isLoading}
                className="ml-2 btn-inkica-primary p-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 relative z-10 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>

              {isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-100 overflow-hidden rounded-b-2xl">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#1E40FF] via-[#0284C7] to-[#06B6D4]"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'linear',
                    }}
                    style={{ width: '50%' }}
                  />
                </div>
              )}
            </div>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Result Section */}
        {imageResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, type: 'spring' }}
            className="inkica-glass-card w-full max-w-4xl mx-auto overflow-hidden"
          >
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div
                className="relative group rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square md:aspect-[4/3] flex items-center justify-center cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
              >
                <img
                  src={imageResult.imageUrl}
                  alt="Extracted Preview"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('magnific.com')) {
                      img.src = img.src.replace('magnific.com', 'freepik.com');
                    }
                  }}
                />
                <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                  <ImageIcon className="w-10 h-10 text-white" />
                  <span className="text-white font-bold text-sm">Bấm để phóng to</span>
                </div>
              </div>

              <div className="flex flex-col h-full justify-center">
                <div className="inline-flex items-center gap-2 text-emerald-700 mb-4 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã tìm thấy file
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">Sẵn sàng tải về</h3>
                <p className="text-slate-600 mb-6 text-sm">
                  File đã được trích xuất thành công. Bạn có thể tải về máy tính với chất lượng cao nhất.
                </p>

                <div className="space-y-3 mb-7">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Định dạng</div>
                    <div className="text-slate-900 font-semibold">
                      {(() => {
                        const match = imageResult.imageUrl.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
                        const ext = match ? match[1].toUpperCase() : 'JPG';
                        return `${ext} File (.${ext.toLowerCase()})`;
                      })()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Nguồn</div>
                    <div className="text-slate-900 font-semibold truncate" title={imageResult.originalUrl}>
                      {new URL(imageResult.originalUrl).hostname}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadImage(imageResult.imageUrl)}
                  className="btn-inkica-primary w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 text-base group cursor-pointer"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  Tải về máy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Zoom Modal */}
      {isZoomed && imageResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 md:p-8"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 p-2 bg-white hover:bg-slate-100 rounded-full text-slate-900 transition-colors shadow cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="flex flex-col items-center max-w-6xl max-h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center bg-white p-2 rounded-2xl shadow-2xl">
              <img
                src={imageResult.imageUrl}
                alt="Zoomed Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
            <div className="mt-6 flex gap-4 w-full max-w-md">
              <button
                type="button"
                onClick={() => downloadImage(imageResult.imageUrl)}
                className="btn-inkica-primary flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 text-base group cursor-pointer"
              >
                <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                Tải về máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
