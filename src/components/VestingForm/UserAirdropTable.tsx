import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import {
  AirdropStatus,
  AIRDROP_CATEGORY_STATUS,
  VALID_AIRDROP_CATEGORIES,
} from '@/sections';

type Props = {
  categoryTotals: Record<string, number>;
};

export const UserAirdropTable = ({ categoryTotals }: Props) => (
  <div className="relative border border-white/10 rounded-md">
    <Table className="table-fixed w-full text-sm text-gray-300">
      <TableHeader className="bg-black border-b border-white/10">
        <TableRow>
          <TableHead className="w-[35%] text-white text-left">
            Category
          </TableHead>
          <TableHead className="w-[40%] text-white text-left pl-12">
            Airdrop
          </TableHead>
          <TableHead className="w-[25%] text-white text-right">
            Status
          </TableHead>
        </TableRow>
      </TableHeader>
    </Table>
    <div className="max-h-[96px] overflow-y-auto w-full scrollbar-blue">
      <Table className="table-fixed w-full text-sm text-gray-300">
        <TableBody>
          {VALID_AIRDROP_CATEGORIES.map(category => (
            <TableRow key={category}>
              <TableCell className="w-[35%] text-white text-left">
                {category}
              </TableCell>
              <TableCell className="w-[40%] text-left pl-12">
                {[AirdropStatus.NotStarted, AirdropStatus.NotCounted].includes(
                  AIRDROP_CATEGORY_STATUS[category],
                )
                  ? '-'
                  : categoryTotals[category].toLocaleString('en-US')}
              </TableCell>
              <TableCell className="w-[25%] text-right">
                <span
                  className={`${
                    AIRDROP_CATEGORY_STATUS[category] === AirdropStatus.Ongoing
                      ? 'text-success'
                      : AIRDROP_CATEGORY_STATUS[category] ===
                            AirdropStatus.NotStarted ||
                          AIRDROP_CATEGORY_STATUS[category] ===
                            AirdropStatus.NotCounted
                        ? 'text-warning'
                        : 'text-white'
                  }`}
                >
                  {AIRDROP_CATEGORY_STATUS[category]}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
