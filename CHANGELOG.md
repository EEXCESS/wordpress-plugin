# 0.5 (2014-12-04)

###Features:
   - Added new Citationsstyles:
      - DIN 1505-2
      - Harvard - Gesellschaft für Bildung und Forschung in Europa (German)
   - Meaningful text for inserted Links (not any longer the static 'link'). It's derived from the search phrase.
   - References in the text (the [x] thing) now link to the citation on the bottom of the text.
   - If available, entries in the resultlist now show information about the creator and the year
     instead of provider an language.
   - New logo for the "delete Citation"-function.

###Documentation:
  - Created a Changelog

###Bugfixes:
   - Under rarely appearing circumstances the insertion of a citation failed, due to null-reference.
   This has been fixed.
   - Links in the citation area will open a new tab insead of opening the page inline
   - The infinite search for results has been stoped my means of a timeout.
