import { postJson, sendJson, ssoQuery } from './utils';

const env = process.env;
const graphQlUrl = 'https://st.griddynamics.net/api/graphql';
const options = {
  headers: {
    'Content-type': 'application/json',
  },
  body: JSON.stringify({
    operationName: 'Page_PositionDemand',
    variables: {
      size: 500,
      page: 0,
      accountIds: [],
      projectIds: [],
      sortField: 'STAGE',
      sortDirection: 'ASC',
      workProfileIds: [],
      specializationIds: [],
      gradeIds: [],
      locationIds: [],
      deployDestinationIds: [],
      billableStatusIds: [],
      stageIds: [],
      statusIds: [1],
      onlyEmpty: false,
      dateFrom: null,
      dateTo: null
    },
    query: 'query Page_PositionDemand($size: Int!, $page: Int!, $accountIds: [Long], $projectIds: [Long], $statusIds: [Long], $sortField: Field, $sortDirection: Direction, $workProfileIds: [Long], $specializationIds: [Long], $gradeIds: [Long], $locationIds: [Long], $deployDestinationIds: [Long], $billableStatusIds: [Long], $stageIds: [Long], $onlyEmpty: Boolean, $dateFrom: LocalDate, $dateTo: LocalDate) {\n  positionDemands(size: $size, page: $page, filter: {accountIds: $accountIds, projectIds: $projectIds, statusIds: $statusIds, workProfileIds: $workProfileIds, specializationIds: $specializationIds, gradeIds: $gradeIds, locationIds: $locationIds, deployDestinationIds: $deployDestinationIds, billableStatusIds: $billableStatusIds, stageIds: $stageIds, onlyEmpty: $onlyEmpty, dateFrom: $dateFrom, dateTo: $dateTo}, sort: {field: $sortField, direction: $sortDirection}) {\n    pageNum\n    pageSize\n    content {\n      ...demandTableContent\n      ...demandSidebarInfoContent\n      ...demandSidebarHeaderContent\n      ...demandSidebarCandidatesHeader\n      candidates {\n        ...demandTableProposedCandidates\n        ...demandSidebarCandidatesContent\n        __typename\n      }\n      demandManager {\n        ...demandManager\n        __typename\n      }\n      permissions {\n        ...proposeCandidatePermissions\n        ...demandSidebarCandidatesListPermissions\n        __typename\n      }\n      __typename\n    }\n    pagesTotal\n    elemsTotal\n    pagesTotal\n    __typename\n  }\n}\n\nfragment demandManager on Employee {\n  id\n  firstName\n  familyName\n  avatarUrl\n  __typename\n}\n\nfragment demandTableContent on PositionDemand {\n  id\n  status {\n    id\n    name\n    __typename\n  }\n  stage {\n    id\n    name\n    __typename\n  }\n  type {\n    id\n    billableStatus\n    __typename\n  }\n  startedOn\n  account {\n    id\n    name\n    projects {\n      id\n      name\n      __typename\n    }\n    stakeholders {\n      id\n      fullName\n      __typename\n    }\n    __typename\n  }\n  project {\n    id\n    name\n    __typename\n  }\n  workProfile {\n    id\n    name\n    specializations {\n      id\n      __typename\n    }\n    __typename\n  }\n  specializations {\n    id\n    name\n    __typename\n  }\n  gradeTracks {\n    id\n    name\n    code\n    level\n    __typename\n  }\n  deployDestinations {\n    id\n    name\n    __typename\n  }\n  jobviteId\n  stakeholder {\n    id\n    fullName\n    __typename\n  }\n  permissions {\n    canViewCandidates\n    __typename\n  }\n  __typename\n}\n\nfragment demandTableProposedCandidates on PositionDemandCandidate {\n  id\n  employee {\n    id\n    firstName\n    familyName\n    avatarUrl\n    username\n    __typename\n  }\n  status {\n    id\n    name\n    __typename\n  }\n  jobviteOffer {\n    grade\n    workProfile\n    jobviteEmployee {\n      firstName\n      lastName\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment demandSidebarInfoContent on PositionDemand {\n  ...demandSidebarInfoAccountProject\n  status {\n    id\n    name\n    __typename\n  }\n  stage {\n    id\n    name\n    __typename\n  }\n  recognizedBySales\n  recognizedByDelivery\n  workProfile {\n    id\n    name\n    __typename\n  }\n  specializations {\n    id\n    name\n    __typename\n  }\n  gradeTracks {\n    id\n    name\n    code\n    level\n    __typename\n  }\n  source\n  availabilityForShortTrips\n  startedOn\n  expiredOn\n  durationWeeks\n  deployDestinations {\n    id\n    name\n    __typename\n  }\n  locations {\n    id\n    name\n    __typename\n  }\n  requirements\n  comment\n  permissions {\n    canViewCandidates\n    __typename\n  }\n  stakeholder {\n    id\n    fullName\n    __typename\n  }\n  __typename\n}\n\nfragment demandSidebarInfoAccountProject on PositionDemand {\n  account {\n    id\n    name\n    __typename\n  }\n  project {\n    id\n    name\n    __typename\n  }\n  type {\n    id\n    billableStatus\n    __typename\n  }\n  __typename\n}\n\nfragment demandSidebarHeaderContent on PositionDemand {\n  id\n  status {\n    id\n    name\n    __typename\n  }\n  startedOn\n  permissions {\n    canEditFields\n    canEditComments\n    canEditJobviteOrRequirements\n    __typename\n  }\n  __typename\n}\n\nfragment demandSidebarCandidatesHeader on PositionDemand {\n  jobviteId\n  workProfile {\n    id\n    name\n    __typename\n  }\n  __typename\n}\n\nfragment demandSidebarCandidatesContent on PositionDemandCandidate {\n  id\n  created\n  location\n  priority\n  comment\n  proposedBy {\n    username\n    firstName\n    familyName\n    __typename\n  }\n  employee {\n    id\n    grade\n    avatarUrl\n    username\n    familyName\n    firstName\n    workProfile\n    __typename\n  }\n  status {\n    id\n    name\n    __typename\n  }\n  jobviteOffer {\n    grade\n    workProfile\n    jobviteEmployee {\n      firstName\n      lastName\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment proposeCandidatePermissions on DemandPermissions {\n  canProposeCandidates\n  __typename\n}\n\nfragment demandSidebarCandidatesListPermissions on DemandPermissions {\n  canEditCandidateStatus\n  canEditCandidatePriority\n  canEditCandidateComment\n  __typename\n}\n'
  })
};

export default class StaffingToolCtrl {
  ssoHeader = null;

  queryDemands = (): Promise<any> => {
    return ssoQuery(graphQlUrl, options);
  }

  getDemands = (req, res): void => {
    this.queryDemands()
      .then(data => sendJson(data, res))
      .catch(() => res.sendStatus(500));
  }

}