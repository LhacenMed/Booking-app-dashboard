import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Chip } from "@heroui/react";
import { FiPlus } from "react-icons/fi";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "User";
  status: "Active" | "Pending";
};

// Sample data - would come from the API in a real implementation
const sampleMembers: TeamMember[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
  { id: "2", name: "Alice Smith", email: "alice@example.com", role: "Manager", status: "Active" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", status: "Pending" },
];

export const TeamSettings = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <Button color="primary" startContent={<FiPlus />}>
          Invite Member
        </Button>
      </div>
      
      <Table aria-label="Team members table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>ROLE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {sampleMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size="sm" />
                  <span>{member.name}</span>
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell>
                <Chip 
                  color={member.status === "Active" ? "success" : "warning"}
                  size="sm"
                >
                  {member.status}
                </Chip>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="light">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 