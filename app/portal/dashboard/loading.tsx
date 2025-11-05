import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export default function Loading() {
  return (
    <div>
      <div className="grid gap-6">
        <Skeleton className="h-4 w-[100px]" />
        {/* Metric cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-[100px]" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[150px]" />
                <Skeleton className="mt-1 h-4 w-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard Title */}
      <div className="mb-6 mt-10 flex h-16 items-center">
        <Skeleton className="mr-2 h-8 w-[200px]" />
        <Skeleton className="h-10 w-10" />
      </div>

      {/* Biller Boards Section */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-[150px]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableHead>
                    {[...Array(4)].map((_, i) => (
                      <TableHead key={i}>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      {[...Array(5)].map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-[80px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Map Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-[200px]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

