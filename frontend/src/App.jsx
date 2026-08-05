import DashboardLayout from "./components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [stock, setStock] = useState(null);

  useEffect(() => {
    api
      .get("/stocks/AAPL")
      .then((response) => {
        setStock(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <DashboardLayout>
      {!stock ? (
        <h1>Loading...</h1>
      ) : (
        <div className="bg-slate-900 p-8 rounded-xl w-96">
          <h1 className="text-4xl font-bold text-blue-500">
            {stock.company}
          </h1>

          <p className="mt-4 text-xl">
            Price : ${stock.price}
          </p>

          <p>High : {stock.high}</p>
          <p>Low : {stock.low}</p>
          <p>Open : {stock.open}</p>
          <p>Volume : {stock.volume}</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;