import { useEffect, useState } from "react";
import api from "./services/api";

import DashboardLayout from "./components/layout/DashboardLayout";
import SearchBar from "./components/dashboard/SearchBar";
import StockCard from "./components/dashboard/StockCard";

function App() {
  const [stock, setStock] = useState(null);
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/stocks/${symbol}`);

      setStock(response.data);
    } catch (error) {
      console.error(error);
      alert("Stock not found!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  return (
    <DashboardLayout>
      <SearchBar
        symbol={symbol}
        setSymbol={setSymbol}
        onSearch={fetchStock}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-blue-500 animate-pulse">
            Loading stock data...
          </p>
        </div>
      ) : (
        <StockCard stock={stock} />
      )}
    </DashboardLayout>
  );
}

export default App;