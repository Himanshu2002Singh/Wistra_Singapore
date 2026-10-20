import React, { useCallback, useEffect, useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { Mail, Search, Users } from 'lucide-react';
import { getMemberDirectoryApi } from '@/services/memberService';

const PAGE_SIZE = 12;

const Directory = () => {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMemberDirectoryApi({ search, company, page, pageSize: PAGE_SIZE });
      setMembers(response.data?.members || []);
      setCompanies(response.data?.filters?.companies || []);
      setPagination(response.data?.pagination || null);
    } catch (requestError) {
      setMembers([]);
      setCompanies([]);
      setPagination(null);
      setError(requestError.response?.data?.message || 'We could not load the member directory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, company, page]);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <Users size={14} />
            <span>GLOBAL NETWORK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Member Directory</h1>
          <p className="text-sm text-slate-300">Connect with fellow members across the WISTA network.</p>
        </div>

        <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-3" role="search">
          <label className="sr-only" htmlFor="member-directory-search">Search members</label>
          <input
            id="member-directory-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            placeholder="Search by name, company, or profile"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0c243b] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-[#5ee5e9] focus:outline-none"
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5ee5e9] px-5 py-3 text-sm font-semibold text-[#082238] hover:bg-[#8cf0f2]">
            <Search size={16} /> Search
          </button>
        </form>
        {companies.length > 0 && (
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <label htmlFor="member-directory-company" className="text-xs font-semibold uppercase tracking-wider text-slate-300">Filter by company</label>
            <select
              id="member-directory-company"
              value={company}
              onChange={(event) => { setCompany(event.target.value); setPage(1); }}
              className="rounded-xl border border-white/15 bg-[#0c243b] px-4 py-3 text-sm text-white focus:border-[#5ee5e9] focus:outline-none"
            >
              <option value="">All visible companies</option>
              {companies.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        )}

        {loading && (
          <div role="status" className="rounded-2xl border border-white/10 bg-[#0c243b] p-8 text-center text-sm text-slate-300">
            Loading member directory…
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-2xl border border-rose-300/30 bg-[#0c243b] p-8 text-center">
            <p className="text-sm text-rose-200">{error}</p>
            <button type="button" onClick={loadDirectory} className="mt-4 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Retry</button>
          </div>
        )}

        {!loading && !error && members.length === 0 && (
          <div role="status" className="rounded-2xl border border-white/10 bg-[#0c243b] p-8 text-center">
            <h2 className="font-[var(--serif)] text-2xl font-normal text-white">{search ? 'No members found' : 'No members to display yet'}</h2>
            <p className="mt-3 text-sm text-slate-300">{search ? 'Try a different name, company, or profile search.' : 'Current member profiles will appear here when available.'}</p>
          </div>
        )}

        {!loading && !error && members.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => {
                const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ');
                return (
                  <article key={member.id} className="rounded-2xl border border-white/10 bg-[#0c243b] p-6 shadow-xl">
                    <div className="flex items-center gap-4">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt="" className="h-14 w-14 rounded-full border border-white/15 object-cover" />
                      ) : (
                        <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-[#5ee5e9]">
                          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate font-[var(--serif)] text-xl text-white">{fullName}</h2>
                        {member.designation && <p className="truncate text-sm text-slate-300">{member.designation}</p>}
                      </div>
                    </div>
                    {member.company && <p className="mt-5 text-sm font-medium text-[#5ee5e9]">{member.company}</p>}
                    {member.biography && <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-300">{member.biography}</p>}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="mt-5 inline-flex max-w-full items-center gap-2 break-all text-sm text-slate-200 hover:text-[#5ee5e9]">
                        <Mail size={15} className="shrink-0" /> {member.email}
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[#5ee5e9] hover:underline">LinkedIn profile</a>
                    )}
                  </article>
                );
              })}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <nav aria-label="Member directory pages" className="flex items-center justify-center gap-4 text-sm text-slate-300">
                <button type="button" disabled={!pagination.hasPrevious} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-white/15 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button type="button" disabled={!pagination.hasNext} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-white/15 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </nav>
            )}
          </>
        )}
      </div>
    </MemberLayout>
  );
};

export default Directory;
