import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const MagnificDownloader = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<{ originalUrl: string, imageUrl: string } | null>(null);

  const extractImageFromUrl = async (inputUrl: string) => {
    setIsLoading(true);
    setError(null);
    setImageResult(null);

    try {
      // Validate URL format
      if (!inputUrl.includes('magnific.com') && !inputUrl.includes('freepik.com') && !inputUrl.includes('stock.adobe.com')) {
        throw new Error('Vui lòng nhập link hợp lệ từ Magnific, Freepik hoặc Adobe Stock');
      }

      // 1. Tích hợp Fotoget API Bypass (chỉ dùng cho Freepik/Magnific)
      if (inputUrl.includes('magnific.com') || inputUrl.includes('freepik.com')) {
        try {
          const proxyBase = 'https://open.domation.net/proxy/magnific_proxy.php';
          const type = 15; // Type ID cho Freepik trên Fotoget
          
          const previewRes = await fetch(`${proxyBase}?action=imagePreview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `str=${encodeURIComponent(inputUrl)}&type=${type}`
          });
          
          if (previewRes.ok) {
            const previewData = await previewRes.json();
            if (previewData && previewData.try_parsing_id) {
              // Chờ server Fotoget xử lý (tối đa 3 lần x 2s)
              for (let i = 0; i < 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const checkRes = await fetch(`${proxyBase}?action=checkTryParsing`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: `str=${encodeURIComponent(inputUrl)}&type=${type}&try_parsing_id=${previewData.try_parsing_id}`
                });
                
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.ok === 1 && checkData.objects && checkData.objects[0]) {
                    const pic = checkData.objects[0].pic;
                    if (pic) {
                      setImageResult({
                        originalUrl: inputUrl,
                        imageUrl: `https://fotoget.org${pic}`
                      });
                      setIsLoading(false);
                      return; // Thoát luôn, đã cào thành công!
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn("Fotoget bypass failed, falling back to HTML parsing...", e);
        }
      }

      // Nếu là Adobe Stock hoặc Fotoget thất bại, chuyển sang lấy HTML qua Proxy (ScraperAPI)
      const proxyUrl = `https://open.domation.net/proxy/magnific_proxy.php?url=${encodeURIComponent(inputUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Không thể kết nối đến máy chủ proxy.');
      }

      let html = '';
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }

      if (!html) {
        throw new Error('Không thể tải nội dung trang.');
      }

      // Phát hiện tường lửa DataDome / Cloudflare chặn bot từ proxy
      if (html.includes('captcha-delivery.com') || html.includes('Cloudflare') || html.includes('Please enable JS and disable any ad blocker')) {
        throw new Error('PROXY_BLOCKED');
      }

      // 2. Tìm trong thẻ meta og:image hoặc twitter:image
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);

      // 2. Tìm ảnh độ phân giải cao trong nội dung HTML (Freepik CDN hoặc Adobe Stock CDN)
      const freepikCdnMatches = html.match(/https:\/\/(img\.)?(magnific\.com|freepik\.com)\/(free-photo|premium-psd|free-vector|premium-photo)[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
      const adobeCdnMatches = html.match(/https:\/\/(as[12]\.ftcdn\.net|t[34]\.ftcdn\.net)\/v2\/jpg\/[^"'\s]+\.(jpg|jpeg)/gi) ||
        html.match(/https:\/\/(as[12]\.ftcdn\.net|t[34]\.ftcdn\.net)\/jpg\/[^"'\s]+\.(jpg|jpeg)/gi);

      let extractedImageUrl = '';

      if (freepikCdnMatches && freepikCdnMatches.length > 0) {
        // Thường Freepik có nhiều size, ta lấy link gốc và ép CDN trả về width 2000px (siêu nét)
        const baseLink = freepikCdnMatches[0].split('?')[0];
        extractedImageUrl = baseLink + '?w=2000&t=st=' + Date.now();
      } else if (adobeCdnMatches && adobeCdnMatches.length > 0) {
        // Adobe Stock lấy link CDN đầu tiên
        extractedImageUrl = adobeCdnMatches[0].split('?')[0];
      } else if (ogImageMatch && ogImageMatch[1]) {
        const baseLink = ogImageMatch[1].split('?')[0];
        // Chỉ ép size nếu là freepik
        if (baseLink.includes('freepik.com') || baseLink.includes('magnific.com')) {
          extractedImageUrl = baseLink + '?w=2000&t=st=' + Date.now();
        } else {
          extractedImageUrl = baseLink;
        }
      }

      if (!extractedImageUrl) {
        throw new Error('Không tìm thấy ảnh từ link này. Có thể cấu trúc trang đã thay đổi.');
      }

      // Replace freepik with magnific if needed, to match user request
      if (inputUrl.includes('magnific.com') && extractedImageUrl.includes('freepik.com')) {
        extractedImageUrl = extractedImageUrl.replace('freepik.com', 'magnific.com');
      }

      setImageResult({
        originalUrl: inputUrl,
        imageUrl: extractedImageUrl
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích link.';

      if (errorMessage === 'PROXY_BLOCKED' || errorMessage.includes('fetch') || errorMessage.includes('kết nối proxy')) {
        setError('Hệ thống Proxy của bạn đã bị tường lửa (Cloudflare/DataDome) chặn (Lỗi 403). Cần sử dụng ScraperAPI hoặc Session Cookies để vượt qua bức tường bảo mật của trang gốc.');
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
      extractImageFromUrl(pastedText);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      extractImageFromUrl(url);
    }
  };

  const downloadImage = (imageUrl: string) => {
    // Để force download thay vì mở tab mới do lỗi CORS, tải qua proxy php với action=downloadImage
    const proxyDownloadUrl = `https://open.domation.net/proxy/magnific_proxy.php?action=downloadImage&imgUrl=${encodeURIComponent(imageUrl)}`;
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 lg:py-24 relative z-10 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-amber-400 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Premium Tool
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img loading="lazy" decoding="async" src="/imgs/ICON.png" alt="DOMATION Logo" className="w-12 h-12 object-contain rounded-[14px] shadow-lg shadow-amber-500/20" />
                <div className="absolute -inset-1 rounded-[18px] bg-amber-500/10 blur-md -z-10" />
              </div>
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500">
                DOMATION
              </span>
            </div>

          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight shimmer-text inline-block pb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500">
            DOWNLOAD PREMIUM
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Dán đường link ảnh từ Magnific, Freepik vào ô bên dưới để tự động lấy link ảnh gốc.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-3xl mx-auto mb-12"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-rose-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center w-full bg-[#141414] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-amber-500/50">
              <div className="pl-4 pr-2 text-neutral-500">
                <LinkIcon className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://stock.adobe.com/... hoặc Freepik"
                className="w-full bg-transparent border-none outline-none text-white placeholder-neutral-600 py-4 px-2 text-lg font-medium"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!url || isLoading}
                className="ml-2 bg-white text-black p-4 rounded-xl font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ArrowRight className="w-6 h-6" />
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Result Section */}
        {imageResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-full max-w-4xl mx-auto bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
          >
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              {/* Image Preview */}
              <div className="relative group rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 aspect-square md:aspect-[4/3] flex items-center justify-center">
                <img
                  src={imageResult.imageUrl}
                  alt="Extracted Preview"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    // If the proxy image fails, try changing img.magnific to img.freepik
                    const img = e.target as HTMLImageElement;
                    if (img.src.includes('magnific.com')) {
                      img.src = img.src.replace('magnific.com', 'freepik.com');
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <ImageIcon className="w-12 h-12 text-white/50" />
                </div>
              </div>

              {/* Details & Actions */}
              <div className="flex flex-col h-full justify-center">
                <div className="inline-flex items-center gap-2 text-green-400 mb-4 bg-green-400/10 px-3 py-1.5 rounded-full w-fit text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã tìm thấy ảnh
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Sẵn sàng tải về</h3>
                <p className="text-neutral-400 mb-8 text-sm">Ảnh đã được trích xuất thành công. Bạn có thể tải về máy với định dạng JPG chất lượng cao.</p>

                <div className="space-y-4 mb-8">
                  <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Định dạng</div>
                    <div className="text-white font-medium">JPEG Image (.jpg)</div>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Nguồn</div>
                    <div className="text-white font-medium truncate" title={imageResult.originalUrl}>
                      {new URL(imageResult.originalUrl).hostname}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => downloadImage(imageResult.imageUrl)}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 text-lg group"
                >
                  <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  Tải về máy (.JPG)
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
