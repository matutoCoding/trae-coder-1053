import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import MonitoringNetwork from "@/pages/MonitoringNetwork";
import WaterLevelData from "@/pages/WaterLevelData";
import DrawdownTrend from "@/pages/DrawdownTrend";
import LandSubsidence from "@/pages/LandSubsidence";
import OverdraftWarning from "@/pages/OverdraftWarning";
import RechargeManagement from "@/pages/RechargeManagement";
import ReportGeneration from "@/pages/ReportGeneration";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MonitoringNetwork />} />
          <Route path="/water-level" element={<WaterLevelData />} />
          <Route path="/drawdown-trend" element={<DrawdownTrend />} />
          <Route path="/land-subsidence" element={<LandSubsidence />} />
          <Route path="/overdraft-warning" element={<OverdraftWarning />} />
          <Route path="/recharge-management" element={<RechargeManagement />} />
          <Route path="/report-generation" element={<ReportGeneration />} />
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                  <p className="text-gray-500 text-lg">页面不存在或正在建设中</p>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
