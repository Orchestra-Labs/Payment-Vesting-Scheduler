import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import { truncateString } from '@/sections';
import { walletPrefix } from '@/constants';

type Props = {
  topRecipients: { recipient: string; amount: number }[];
};

export const TopRecipientsTable = ({ topRecipients }: Props) => (
  <div className="relative border border-white/10 rounded-md">
    <Table className="table-fixed w-full text-sm text-gray-300">
      <TableHeader className="bg-black border-b border-white/10">
        <TableRow>
          <TableHead className="w-[5%] text-white text-center">#</TableHead>
          <TableHead className="w-[65%] text-white text-left pl-12">
            Address
          </TableHead>
          <TableHead className="w-[30%] text-white text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
    </Table>
    <div className="max-h-[96px] overflow-y-auto w-full scrollbar-blue">
      <Table className="table-fixed w-full text-sm text-gray-300">
        <TableBody>
          {topRecipients.map((entry, index) => (
            <TableRow key={`${entry.recipient}-${index}`}>
              <TableCell className="w-[5%] text-center text-white">
                {index + 1}
              </TableCell>
              <TableCell className="w-[65%] truncate text-white text-left pl-12">
                {truncateString(walletPrefix, entry.recipient)}
              </TableCell>
              <TableCell className="w-[30%] text-right text-green-400">
                {entry.amount.toLocaleString('en-US')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
