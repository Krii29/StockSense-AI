import StatCard from "./StatCard";

export default function StockCard({ stock }) {

    if (!stock) return null;

    return (

        <div>

            <h1 className="text-4xl font-bold text-blue-500">
                {stock.company}
            </h1>

            <p className="text-slate-400 mb-8">
                {stock.symbol}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                <StatCard
                    title="💰 Current Price"
                    value={`$${stock.price}`}
                />

                <StatCard
                    title="📈 High"
                    value={stock.high}
                />

                <StatCard
                    title="📉 Low"
                    value={stock.low}
                />

                <StatCard
                    title="📦 Volume"
                    value={stock.volume?.toLocaleString()}
                />

            </div>

        </div>

    );

}