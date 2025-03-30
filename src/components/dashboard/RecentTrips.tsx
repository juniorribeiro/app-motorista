
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  date: string;
  distance: number;
  earnings: number;
  hours: string;
  fuelCost: number;
}

interface RecentTripsProps {
  trips: Trip[];
  className?: string;
}

const RecentTrips = ({ trips, className }: RecentTripsProps) => {
  return (
    <Card className={cn("card-hover", className)}>
      <CardHeader>
        <CardTitle>Viagens Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Distância (km)</TableHead>
              <TableHead className="hidden md:table-cell">Horas</TableHead>
              <TableHead className="text-right">Ganho Líq.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>{trip.date}</TableCell>
                <TableCell>{trip.distance}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {trip.hours}
                </TableCell>
                <TableCell className="text-right">
                  R$ {(trip.earnings - trip.fuelCost).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTrips;
