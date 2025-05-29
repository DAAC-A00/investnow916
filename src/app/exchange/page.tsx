import Link from 'next/link';

export default function ExchangePage() {
  const features = [
    {
      title: 'Bybit 거래소',
      description: '바이비트 거래소의 코인 정보를 확인하세요. 현물, 선물, 옵션 등 다양한 카테고리의 코인 정보를 제공합니다.',
      href: '/exchange/bybit',
      cta: '바이비트 코인 정보 보기',
    },
    {
      title: '환율 정보',
      description: '실시간 환율 정보를 확인하세요. 다양한 통화의 환율을 비교하고 기준 통화를 변경할 수 있습니다.',
      href: '/fiat',
      cta: '환율 정보 보기',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">거래소 정보</h1>
        <p className="text-lg text-muted-foreground">
          다양한 거래소의 코인 정보와 환율 정보를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-3">{feature.title}</h2>
            <p className="text-muted-foreground mb-6">{feature.description}</p>
            <Link
              href={feature.href}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {feature.cta}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
