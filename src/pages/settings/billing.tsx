import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import { FiCreditCard, FiDownload } from "react-icons/fi";

type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
};

// Sample data for demonstration
const sampleInvoices: Invoice[] = [
  { id: "INV-001", date: "2023-06-01", amount: 49.99, status: "Paid" },
  { id: "INV-002", date: "2023-07-01", amount: 49.99, status: "Paid" },
  { id: "INV-003", date: "2023-08-01", amount: 49.99, status: "Paid" },
];

export const BillingSettings = () => {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Billing & Subscription</h2>

      {/* Current Plan */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">Current Plan</h3>
              <div className="flex items-center gap-2 my-1">
                <span className="text-2xl font-bold">Pro Plan</span>
                <Chip color="primary" size="sm">
                  Monthly
                </Chip>
              </div>
              <p className="text-default-500">$49.99/month</p>
            </div>
            <Button color="primary" variant="flat">
              Upgrade Plan
            </Button>
          </div>

          <Divider className="my-4" />

          <div>
            <p className="text-default-600 mb-1">Plan Features:</p>
            <ul className="text-default-500 list-disc list-inside space-y-1">
              <li>Unlimited trips</li>
              <li>Team management</li>
              <li>Advanced analytics</li>
              <li>24/7 support</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Payment Method</h3>
            <Button variant="flat" startContent={<FiCreditCard />}>
              Add Payment Method
            </Button>
          </div>

          <div className="p-4 border rounded-md flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💳</div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-default-500 text-sm">Expires 12/2024</p>
              </div>
            </div>
            <Button size="sm" variant="light">
              Edit
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Billing History</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {sampleInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex justify-between items-center py-2"
              >
                <div>
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-default-500 text-sm">{invoice.date}</p>
                </div>
                <div className="text-end">
                  <p className="font-medium">${invoice.amount}</p>
                  <Chip
                    size="sm"
                    color={
                      invoice.status === "Paid"
                        ? "success"
                        : invoice.status === "Pending"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {invoice.status}
                  </Chip>
                </div>
                <Button isIconOnly variant="light" size="sm">
                  <FiDownload />
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
