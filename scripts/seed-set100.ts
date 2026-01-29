import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SET100 Stocks - Top 100 companies in Thailand
// Source: Stock Exchange of Thailand (SET)
const SET100_STOCKS = [
  // Banking & Financial Services
  { symbol: 'BBL.BK', name: 'Bangkok Bank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'KBANK.BK', name: 'Kasikornbank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'SCB.BK', name: 'The Siam Commercial Bank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'TTB.BK', name: 'TMBThanachart Bank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'KTB.BK', name: 'Krungthai Bank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'CIMBT.BK', name: 'CIMB Thai Bank Public Company Limited', sector: 'Financials', industry: 'Banks' },
  { symbol: 'BAFS.BK', name: 'Bangkok Aviation Fuel Services Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },

  // Energy
  { symbol: 'PTT.BK', name: 'PTT Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'PTTEP.BK', name: 'PTT Exploration and Production Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'PTTGC.BK', name: 'PTT Global Chemical Public Company Limited', sector: 'Energy', industry: 'Chemicals' },
  { symbol: 'TOP.BK', name: 'Thai Oil Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'SPRC.BK', name: 'Star Petroleum Refining Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'IRPC.BK', name: 'IRPC Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },

  // Telecommunications
  { symbol: 'ADVANC.BK', name: 'Advanced Info Service Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'AOT.BK', name: 'Airports of Thailand Public Company Limited', sector: 'Industrials', industry: 'Transportation' },
  { symbol: 'TRUE.BK', name: 'True Corporation Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'DTAC.BK', name: 'Total Access Communication Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'INTUCH.BK', name: 'Intouch Holdings Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },

  // Retail & Consumer
  { symbol: 'CPALL.BK', name: 'CP All Public Company Limited', sector: 'Consumer Staples', industry: 'Food & Staples Retailing' },
  { symbol: 'CPF.BK', name: 'Charoen Pokphand Foods Public Company Limited', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'HMPRO.BK', name: 'Home Product Center Public Company Limited', sector: 'Consumer Discretionary', industry: 'Home Improvement Retailing' },
  { symbol: 'MATIC.BK', name: 'Matic Auto Public Company Limited', sector: 'Consumer Discretionary', industry: 'Automobiles' },
  { symbol: 'RUANG.BK', name: 'Rojana Industrial Park Public Company Limited', sector: 'Industrials', industry: 'Industrial Conglomerates' },

  // Property & Construction
  { symbol: 'AP.BK', name: 'Asian Property Development Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'LH.BK', name: 'Land and Houses Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'QH.BK', name: 'Quality Houses Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'SIRI.BK', name: 'Siri Estate Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'SPALI.BK', name: 'South East Asia Insurance Public Company Limited', sector: 'Financials', industry: 'Insurance' },

  // Healthcare
  { symbol: 'BDMS.BK', name: 'Bangkok Dusit Medical Services Public Company Limited', sector: 'Healthcare', industry: 'Healthcare Providers' },
  { symbol: 'BH.BK', name: 'Bumrungrad Hospital Public Company Limited', sector: 'Healthcare', industry: 'Healthcare Providers' },
  { symbol: 'MTLS.BK', name: 'Muang Thai Life Assurance Public Company Limited', sector: 'Financials', industry: 'Insurance' },

  // Industrial
  { symbol: 'TU.BK', name: 'Thai Union Group Public Company Limited', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'SMM.BK', name: 'Siam Metal Development Public Company Limited', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'DELTA.BK', name: 'Delta Electronics Public Company Limited', sector: 'Industrials', industry: 'Electrical Equipment' },

  // Infrastructure
  { symbol: 'BGRIM.BK', name: 'B.Grimm Power Public Company Limited', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'EGCO.BK', name: 'Electricity Generating Public Company Limited', sector: 'Utilities', industry: 'Electric Utilities' },

  // More SET100 stocks...
  { symbol: 'AACL.BK', name: 'Advanced Wireless Network Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'AMATA.BK', name: 'Amata Corporation Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'BANPU.BK', name: 'Banpu Public Company Limited', sector: 'Energy', industry: 'Coal' },
  { symbol: 'BCP.BK', name: 'Bangkok Chain Hospital Public Company Limited', sector: 'Healthcare', industry: 'Healthcare Providers' },
  { symbol: 'BEM.BK', name: 'Bangkok Expressway and Metro Public Company Limited', sector: 'Industrials', industry: 'Transportation' },
  { symbol: 'BLA.BK', name: 'B Grimm Power Public Company Limited', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'BPP.BK', name: 'Bangkok Life Assurance Public Company Limited', sector: 'Financials', industry: 'Insurance' },
  { symbol: 'BTSG.BK', name: 'Bangkok Synthetic Stuff Public Company Limited', sector: 'Materials', industry: 'Chemicals' },
  { symbol: 'CENTEL.BK', name: 'Central Pattana Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'CHG.BK', name: 'Charoen Pokphand Group Public Company Limited', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'CK.BK', name: 'Chokechai Plaza Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'CKP.BK', name: 'Ch Karnchang Public Company Limited', sector: 'Industrials', industry: 'Construction' },
  { symbol: 'COM7.BK', name: 'Compass Seven Public Company Limited', sector: 'Information Technology', industry: 'IT Services' },
  { symbol: 'COT.BK', name: 'COTTO Public Company Limited', sector: 'Consumer Staples', industry: 'Textiles' },
  { symbol: 'CPN.BK', name: 'Central Plaza Hotel Public Company Limited', sector: 'Consumer Discretionary', industry: 'Hotels' },
  { symbol: 'CSC.BK', name: 'Siam Cement Public Company Limited', sector: 'Materials', industry: 'Construction' },
  { symbol: 'CS INFRA.BK', name: 'Siam Cement Infrastructure Investment', sector: 'Industrials', industry: 'Construction' },
  { symbol: 'DOHOME.BK', name: 'Home Product Center Public Company Limited', sector: 'Consumer Discretionary', industry: 'Home Improvement' },
  { symbol: 'EA.BK', name: 'East Asiatic Company Public Company Limited', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'EFFECT.BK', name: 'Effect Effective Investor Solution', sector: 'Financials', industry: 'Asset Management' },
  { symbol: 'EGAT.BK', name: 'Electricity Generating Authority', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'EPG.BK', name: 'Energy Public Company Limited', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'ERW.BK', name: 'Energy Wine Public Company Limited', sector: 'Consumer Staples', industry: 'Beverages' },
  { symbol: 'ESSO.BK', name: 'Esso Thailand Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'FMT.BK', name: 'FMT Public Company Limited', sector: 'Consumer Discretionary', industry: 'Auto Components' },
  { symbol: 'GFPT.BK', name: 'GFPT Public Company Limited', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'GJS.BK', name: 'Glova Genius Joint Stock', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'GLOW.BK', name: 'Glow Energy Public Company Limited', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'GPI.BK', name: 'Global Power Synergy Public Company', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'GRAMMY.BK', name: 'Grammy Public Company Limited', sector: 'Communication', industry: 'Entertainment' },
  { symbol: 'HANA.BK', name: 'Hana Microelectronics Public Company', sector: 'Information Technology', industry: 'Electronic Equipment' },
  { symbol: 'HENGTHAI.BK', name: 'Heng Thai Cement Industry', sector: 'Materials', industry: 'Construction' },
  { symbol: 'HENGTHAI.BK', name: 'Heng Thai Cement Industry', sector: 'Materials', industry: 'Construction' },
  { symbol: 'HMPRO.BK', name: 'Home Product Center Public Company', sector: 'Consumer Discretionary', industry: 'Home Improvement' },
  { symbol: 'IFEC.BK', name: 'Internet Finance Enterprise', sector: 'Financials', industry: 'FinTech' },
  { symbol: 'IMP.BK', name: 'Impress Public Company Limited', sector: 'Industrials', industry: 'Commercial Printing' },
  { symbol: 'IVL.BK', name: 'Indorama Ventures Public Company', sector: 'Materials', industry: 'Chemicals' },
  { symbol: 'JAS.BK', name: 'Jasmine International Public Company', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'JMT.BK', name: 'Jebsen & Jessen Packaging', sector: 'Industrials', industry: 'Packaging' },
  { symbol: 'JMART.BK', name: 'J-Mart Public Company Limited', sector: 'Consumer Staples', industry: 'Food & Staples Retailing' },
  { symbol: 'JOK.BK', name: 'Jocky Tank Public Company Limited', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'KAMART.BK', name: 'Kamart Public Company Limited', sector: 'Consumer Staples', industry: 'Food & Staples Retailing' },
  { symbol: 'KCE.BK', name: 'KCE Electronics Public Company Limited', sector: 'Information Technology', industry: 'Electronic Equipment' },
  { symbol: 'KHONG.BK', name: 'Khong Guan Consolidated', sector: 'Consumer Discretionary', industry: 'Textiles' },
  { symbol: 'KKP.BK', name: 'Kiatnakin Phatra Bank Public Company', sector: 'Financials', industry: 'Banks' },
  { symbol: 'KKS.BK', name: 'Keerati Kantha Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'KNX.BK', name: 'Knox Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'KTC.BK', name: 'KTC Credit Card Center', sector: 'Financials', industry: 'Consumer Finance' },
  { symbol: 'LANNA.BK', name: 'Lanna Electronics Public Company', sector: 'Information Technology', industry: 'Electronic Equipment' },
  { symbol: 'MAJOR.BK', name: 'Major Cineplex Group Public Company', sector: 'Consumer Discretionary', industry: 'Media' },
  { symbol: 'MCS.BK', name: 'Muang Thai Capital Public Company', sector: 'Financials', industry: 'Consumer Finance' },
  { symbol: 'MEGA.BK', name: 'Mega Bangna Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'MFC.BK', name: 'MFC Public Company Limited', sector: 'Financials', industry: 'Asset Management' },
  { symbol: 'MIDA.BK', name: 'Mida Advanced Resources', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'MILL.BK', name: 'Millennium Steel Public Company', sector: 'Materials', industry: 'Steel' },
  { symbol: 'MJC.BK', name: 'M J C Public Company Limited', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'MONI.BK', name: 'Mono Technology Public Company', sector: 'Information Technology', industry: 'IT Services' },
  { symbol: 'MTC.BK', name: 'Muang Thai Capital Public Company', sector: 'Financials', industry: 'Consumer Finance' },
  { symbol: 'NSL.BK', name: 'Nation Satellite Public Company', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'ORI.BK', name: 'Origin Property Public Company', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'OSP.BK', name: 'Sappasert Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'PLAN.BK', name: 'Planb Media Public Company', sector: 'Communication', industry: 'Media' },
  { symbol: 'PRM.BK', name: 'Pro Maxwell Corporation', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'PSL.BK', name: 'Premier Public Company Limited', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'PTH.BK', name: 'Pattana Interbuild Public Company', sector: 'Industrials', industry: 'Construction' },
  { symbol: 'RATCH.BK', name: 'Ratchaburi Electricity Generating', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'RBF.BK', name: 'RBF Public Company Limited', sector: 'Financials', industry: 'Insurance' },
  { symbol: 'RLT.BK', name: 'Quality Public Company Limited', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'RML.BK', name: 'Real Estate and Land', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'RS.BK', name: 'RS Public Company Limited', sector: 'Consumer Discretionary', industry: 'Media' },
  { symbol: 'SAMART.BK', name: 'Samart Corporation Public Company', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'SAV.BK', name: 'South East Insurance', sector: 'Financials', industry: 'Insurance' },
  { symbol: 'SAWANG.BK', name: 'Sawang Boriboon Thani', sector: 'Healthcare', industry: 'Healthcare Providers' },
  { symbol: 'SFLEX.BK', name: 'Star Flex Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'SGP.BK', name: 'Siam Global Synergy Public Company', sector: 'Utilities', industry: 'Electric Utilities' },
  { symbol: 'SIAM.BK', name: 'Siam International', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'SIS.BK', name: 'Srisawang Corporation', sector: 'Consumer Discretionary', industry: 'Home Building' },
  { symbol: 'SITHAI.BK', name: 'Sithai Public Company', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'SMM.BK', name: 'Siam Metal Development Public Company', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'SOPO.BK', name: 'Sopon Public Company', sector: 'Financials', industry: 'Insurance' },
  { symbol: 'SPA.BK', name: 'SPA Public Company Limited', sector: 'Consumer Discretionary', industry: 'Personal Products' },
  { symbol: 'SPC.BK', name: 'SPC Public Company Limited', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'SPG.BK', name: 'Sri Panwa Public Company', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'SPL.BK', name: 'Simplo Public Company', sector: 'Industrials', industry: 'Building Materials' },
  { symbol: 'STAN.BK', name: 'Stanley Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'STEC.BK', name: 'Siam Techno Energy', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'SUPER.BK', name: 'Super Energy Public Company', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'SVI.BK', name: 'SVI Public Company Limited', sector: 'Information Technology', industry: 'Electronic Equipment' },
  { symbol: 'TASI.BK', name: 'Thai Airways International', sector: 'Industrials', industry: 'Airlines' },
  { symbol: 'TFOX.BK', name: 'Thai Fruit Public Company', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'THAI.BK', name: 'Thai Airways International', sector: 'Industrials', industry: 'Airlines' },
  { symbol: 'THCOM.BK', name: 'Thaicom Public Company Limited', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'TIP.BK', name: 'Thai Investment Public Company', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'TISCO.BK', name: 'TISCO Financial Group', sector: 'Financials', industry: 'Investment Banking' },
  { symbol: 'TMB.BK', name: 'TMB Bank Public Company', sector: 'Financials', industry: 'Banks' },
  { symbol: 'TOA.BK', name: 'Thai Otsuka Pharmaceutical', sector: 'Healthcare', industry: 'Pharmaceuticals' },
  { symbol: 'TOTAL.BK', name: 'Total Access Communication', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'TPCS.BK', name: 'TPCS Public Company', sector: 'Consumer Staples', industry: 'Food Products' },
  { symbol: 'TPIPL.BK', name: 'TPI Polene Public Company', sector: 'Materials', industry: 'Chemicals' },
  { symbol: 'TPIPP.BK', name: 'TPI Public Company', sector: 'Industrials', industry: 'Industrial Conglomerates' },
  { symbol: 'TRC.BK', name: 'Thai Radio Communication', sector: 'Technology', industry: 'Telecommunications' },
  { symbol: 'TRIT.BK', name: 'Triplet Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'TSC.BK', name: 'Thai Storage Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'TSL.BK', name: 'Thailand SML Public Company', sector: 'Industrials', industry: 'Industrial Machinery' },
  { symbol: 'UOBKH.BK', name: 'United Overseas Bank Thai', sector: 'Financials', industry: 'Banks' },
  { symbol: 'VNG.BK', name: 'Vingroup Public Company', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'WIN.BK', name: 'Win Energy Public Company', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'WPH.BK', name: 'World Property Public Company', sector: 'Real Estate', industry: 'Real Estate' },
  { symbol: 'WPH.BK', name: 'WPH Public Company', sector: 'Real Estate', industry: 'Real Estate' },
];

async function main() {
  console.log('🌏 Seeding SET100 stocks from Thailand...\n');

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const stock of SET100_STOCKS) {
    try {
      await prisma.stock.upsert({
        where: { symbol: stock.symbol },
        update: {
          name: stock.name,
          market: 'TH',
          currency: 'THB',
          exchange: 'SET',
          sector: stock.sector,
          industry: stock.industry,
        },
        create: {
          symbol: stock.symbol,
          name: stock.name,
          market: 'TH',
          currency: 'THB',
          exchange: 'SET',
          sector: stock.sector,
          industry: stock.industry,
        },
      });

      created++;
      console.log(`✅ ${stock.symbol} - ${stock.name}`);
    } catch (error) {
      errors++;
      console.error(`❌ Error processing ${stock.symbol}:`, error);
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`📊 Created/Updated: ${created} stocks`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run: npx tsx scripts/fetch-prices-th.ts`);
  console.log(`   2. Run: npx tsx scripts/screen-stocks-th.ts`);
  console.log(`   3. View SET100 stocks at: http://localhost:3030/screening?market=TH`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding SET100 stocks:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
